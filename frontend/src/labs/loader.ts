import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Loader, LoaderContext } from "astro/loaders";
import { parseClab } from "./parse-clab";
import { parseReadme } from "./parse-readme";
import { examsFor, topicFor, LAB_VENDORS, type LabVendor } from "./taxonomy";

const CONTENT_ROOT = fileURLToPath(
    new URL("../../labs-content/", import.meta.url),
);

interface LabSource {
    id: string;
    vendor: LabVendor;
    slug: string;
    number: number;
    dir: string;
}

function scanLabSources(): LabSource[] {
    const sources: LabSource[] = [];
    for (const vendor of Object.keys(LAB_VENDORS) as LabVendor[]) {
        const vendorDir = join(CONTENT_ROOT, vendor);
        if (!existsSync(vendorDir)) continue;
        for (const entry of readdirSync(vendorDir, { withFileTypes: true })) {
            if (!entry.isDirectory() || !/^\d{3}-/.test(entry.name)) continue;
            sources.push({
                id: `${vendor}/${entry.name}`,
                vendor,
                slug: entry.name,
                number: Number(entry.name.slice(0, 3)),
                dir: join(vendorDir, entry.name),
            });
        }
    }
    return sources.sort((a, b) => a.id.localeCompare(b.id));
}

function rewriteLabLinks(body: string, labId: string): string {
    const labVendor = labId.split("/")[0];
    return body
        .replace(/\((?:\.\/)?EXTRA\.md\)/g, `(/labs/${labId}/extra/)`)
        .replace(/\((?:\.\/)?ANSWER\.md\)/g, `(/labs/${labId}/solutions/)`)
        .replace(
            /\[[^\]]*labs\/(cisco|arista)\/README\.md[^\]]*\]\((?:\/data\/labs\/(?:cisco|arista)|\.\.)\/README\.md\)/g,
            (_match, vendor) => `[the ${vendor} labs setup guide](/labs/${vendor}/setup/)`,
        )
        .replace(/\(\/data\/labs\/(cisco|arista)\/README\.md\)/g, "(/labs/$1/setup/)")
        .replace(/\(\.\.\/README\.md\)/g, `(/labs/${labVendor}/setup/)`);
}

function transformLabBody(
    body: string,
    source: LabSource,
    title: string,
    diagramUrl: string | null,
): string {
    let output = body.replace(
        /\n## Deploy and Cleanup\r?\n[\s\S]*?(?=\n## |$)/,
        "\n",
    );
    if (diagramUrl) {
        output = output.replace(
            /```mermaid\r?\n[\s\S]*?```/,
            `![Topology diagram for ${title}](${diagramUrl})`,
        );
    }
    output = output.replace(
        /(^|\n)\*\*Hint:\*\*\s*([\s\S]*?)(?=\n\s*\n|$)/g,
        (_match, lead, hint) =>
            `${lead}<details class="lab-hint">\n<summary>hint</summary>\n\n${hint}\n\n</details>`,
    );
    output = output.replace(
        /```\r?\n(===[^\n]*===\r?\n[\s\S]*?)```/g,
        (_match, ticket) => {
            const text = ticket
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .trimEnd();
            return `<pre class="lab-ticket">${text}</pre>`;
        },
    );
    output = output.replace(
        /(\n## Verification Checkpoints[^\n]*\n)([\s\S]*?)(?=\n## |$)/,
        (_match, heading, section) => {
            const hadRule = /\n---\s*$/.test(section);
            const trimmed = section.replace(/\n---\s*$/, "\n");
            return `${heading}<div class="lab-check">\n${trimmed}\n</div>\n${hadRule ? "\n---\n" : ""}`;
        },
    );
    return rewriteLabLinks(output, source.id);
}

function foldSolutionSections(body: string): string {
    return body.replace(
        /(^|\n)## ((?:(?:Task|Trouble Ticket) \d+|Troubleshooting Extension)[^\n]*)\n([\s\S]*?)(?=\n## |$)/g,
        (_match, lead, heading, section) => {
            const summary = heading.replace(/`([^`]+)`/g, "<code>$1</code>");
            const trimmed = section.replace(/\n---\s*$/, "\n");
            return `${lead}<details>\n<summary>${summary}</summary>\n${trimmed}\n</details>\n`;
        },
    );
}

function stripTitle(markdown: string): { title: string; body: string } {
    const lines = markdown.split("\n");
    let index = 0;
    let title = "";
    for (; index < lines.length; index += 1) {
        const heading = lines[index].match(/^#\s+(.+?)\s*$/);
        if (heading) {
            title = heading[1];
            index += 1;
            break;
        }
        if (lines[index].trim() !== "") break;
    }
    while (index < lines.length && lines[index].trim() === "") index += 1;
    if (index < lines.length && lines[index].trim() === "---") {
        index += 1;
        while (index < lines.length && lines[index].trim() === "") index += 1;
    }
    return { title, body: lines.slice(index).join("\n") };
}

function evictUnseen(store: LoaderContext["store"], seen: Set<string>): void {
    for (const id of store.keys()) {
        if (!seen.has(id)) store.delete(id);
    }
}

export function labsLoader(): Loader {
    return {
        name: "labs",
        load: async ({ store, parseData, renderMarkdown, generateDigest }) => {
            const seen = new Set<string>();
            for (const source of scanLabSources()) {
                const readmePath = join(source.dir, "README.md");
                if (!existsSync(readmePath)) continue;
                const raw = readFileSync(readmePath, "utf8");
                const { meta, body } = parseReadme(raw, source.slug);

                const clabFilename = readdirSync(source.dir).find((name) =>
                    name.endsWith(".clab.yml"),
                );
                const clab = clabFilename
                    ? parseClab(readFileSync(join(source.dir, clabFilename), "utf8"))
                    : { deviceCount: 0 };

                const hasDiagram = existsSync(join(source.dir, "topology.png"));
                const diagramUrl = hasDiagram
                    ? `/labs/${source.id}/topology.png`
                    : null;
                const hasAnswer = existsSync(join(source.dir, "ANSWER.md"));

                const data = await parseData({
                    id: source.id,
                    data: {
                        vendor: source.vendor,
                        slug: source.slug,
                        number: source.number,
                        title: meta.title,
                        labCode: meta.labCode,
                        difficulty: meta.difficulty,
                        estTime: meta.estTime,
                        estMinutes: meta.estMinutes,
                        topologySummary: meta.topologySummary,
                        examMapping: meta.examMapping,
                        references: meta.references,
                        exams: examsFor(meta.examMapping),
                        topic: topicFor(meta.labCode),
                        deviceCount: clab.deviceCount,
                        hasAnswer,
                        hasExtra: existsSync(join(source.dir, "EXTRA.md")),
                        zipUrl: `/labs/${source.id}/${source.slug}.zip`,
                        solutionsZipUrl: hasAnswer
                            ? `/labs/${source.id}/${source.slug}-solutions.zip`
                            : null,
                    },
                });

                const transformed = transformLabBody(
                    body,
                    source,
                    meta.title,
                    diagramUrl,
                );
                const digest = generateDigest({ data, body: transformed });
                seen.add(source.id);
                if (store.get(source.id)?.digest === digest) continue;
                store.set({
                    id: source.id,
                    data,
                    body: transformed,
                    digest,
                    rendered: await renderMarkdown(transformed),
                });
            }
            evictUnseen(store, seen);
        },
    };
}

export function labDocsLoader(filename: "ANSWER.md" | "EXTRA.md"): Loader {
    return {
        name: `lab-docs-${filename}`,
        load: async ({ store, parseData, renderMarkdown, generateDigest }) => {
            const seen = new Set<string>();
            for (const source of scanLabSources()) {
                const docPath = join(source.dir, filename);
                if (!existsSync(docPath)) continue;
                const raw = readFileSync(docPath, "utf8");
                const { title, body: rawBody } = stripTitle(raw);
                const rewritten = rewriteLabLinks(rawBody, source.id);
                const body =
                    filename === "ANSWER.md"
                        ? foldSolutionSections(rewritten)
                        : rewritten;

                const data = await parseData({
                    id: source.id,
                    data: {
                        vendor: source.vendor,
                        slug: source.slug,
                        title: title || source.slug,
                    },
                });
                const digest = generateDigest({ data, body });
                seen.add(source.id);
                if (store.get(source.id)?.digest === digest) continue;
                store.set({
                    id: source.id,
                    data,
                    body,
                    digest,
                    rendered: await renderMarkdown(body),
                });
            }
            evictUnseen(store, seen);
        },
    };
}

export function labGuidesLoader(): Loader {
    return {
        name: "lab-guides",
        load: async ({ store, parseData, renderMarkdown, generateDigest }) => {
            const seen = new Set<string>();
            for (const vendor of Object.keys(LAB_VENDORS) as LabVendor[]) {
                const guidePath = join(CONTENT_ROOT, vendor, "README.md");
                if (!existsSync(guidePath)) continue;
                const raw = readFileSync(guidePath, "utf8");
                const { title, body } = stripTitle(raw);
                const transformed = body
                    .replace(
                        /\((?:\.\.\/)?(cisco|arista)\/README\.md\)/g,
                        "(/labs/$1/setup/)",
                    )
                    .replace(
                        /\(\/data\/labs\/(cisco|arista)\/README\.md\)/g,
                        "(/labs/$1/setup/)",
                    );

                const data = await parseData({
                    id: vendor,
                    data: { title: title || vendor },
                });
                const digest = generateDigest({ data, body: transformed });
                seen.add(vendor);
                if (store.get(vendor)?.digest === digest) continue;
                store.set({
                    id: vendor,
                    data,
                    body: transformed,
                    digest,
                    rendered: await renderMarkdown(transformed),
                });
            }
            evictUnseen(store, seen);
        },
    };
}
