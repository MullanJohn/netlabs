export interface ReadmeMeta {
    title: string;
    labCode: string;
    difficulty: string;
    estTime: string;
    estMinutes: number;
    topologySummary: string;
    examMapping: string;
    references: string;
}

export interface ParsedReadme {
    meta: ReadmeMeta;
    body: string;
}

const FIELD_KEYS: Record<string, Exclude<keyof ReadmeMeta, "estMinutes">> = {
    "lab id": "labCode",
    difficulty: "difficulty",
    "est. time": "estTime",
    topology: "topologySummary",
    "exam mapping": "examMapping",
    references: "references",
};

const TABLE_ROW = /^\|([^|]+)\|(.*)\|\s*$/;

function normalizeKey(cell: string): string {
    return cell.replaceAll("*", "").trim().toLowerCase();
}

function parseEstMinutes(estTime: string): number {
    const match = estTime.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
}

export function parseReadme(markdown: string, fallbackTitle: string): ParsedReadme {
    const lines = markdown.split("\n");
    const meta: ReadmeMeta = {
        title: fallbackTitle,
        labCode: "",
        difficulty: "",
        estTime: "",
        estMinutes: 0,
        topologySummary: "",
        examMapping: "",
        references: "",
    };

    let index = 0;
    for (; index < lines.length; index += 1) {
        const heading = lines[index].match(/^#\s+(.+?)\s*$/);
        if (heading) {
            meta.title = heading[1];
            index += 1;
            break;
        }
    }

    while (index < lines.length && !TABLE_ROW.test(lines[index])) index += 1;
    for (; index < lines.length; index += 1) {
        const row = lines[index].match(TABLE_ROW);
        if (!row) break;
        const key = FIELD_KEYS[normalizeKey(row[1])];
        if (key) meta[key] = row[2].trim();
    }
    meta.estMinutes = parseEstMinutes(meta.estTime);

    while (index < lines.length && lines[index].trim() === "") index += 1;
    if (index < lines.length && lines[index].trim() === "---") {
        index += 1;
        while (index < lines.length && lines[index].trim() === "") index += 1;
    }

    return { meta, body: lines.slice(index).join("\n") };
}
