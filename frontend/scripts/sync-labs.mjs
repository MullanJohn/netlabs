import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const frontendRoot = fileURLToPath(new URL("..", import.meta.url));
const source = resolve(
    process.env.LABS_SRC ?? join(frontendRoot, "..", "..", "labs"),
);
const contentDest = join(frontendRoot, "labs-content");
const publicDest = join(frontendRoot, "public", "labs");
const vendors = ["cisco", "arista"];

if (!existsSync(source)) {
    mkdirSync(contentDest, { recursive: true });
    console.warn(
        `sync-labs: source ${source} not found; labs catalog will use existing labs-content (set LABS_SRC to override)`,
    );
    process.exit(0);
}

function labDirs(vendorSrc) {
    return readdirSync(vendorSrc, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^\d{3}-/.test(entry.name))
        .map((entry) => entry.name)
        .sort();
}

function walk(dir, prefix = "") {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) files.push(...walk(join(dir, entry.name), rel));
        else files.push(rel);
    }
    return files;
}

function pruneStale(dest, expected) {
    if (!existsSync(dest)) return;
    for (const entry of readdirSync(dest)) {
        if (!expected.has(entry)) {
            rmSync(join(dest, entry), { recursive: true });
        }
    }
}

function writeBundle(zipPath, labSrc, slug, files) {
    if (files.length === 0) return false;
    const bundle = {};
    for (const file of files) {
        bundle[`${slug}/${file}`] = readFileSync(join(labSrc, file));
    }
    writeFileSync(zipPath, zipSync(bundle, { level: 6 }));
    return true;
}

function isSolutionFile(file) {
    return file === "ANSWER.md" || file.startsWith("configs-answer/");
}

let labCount = 0;
let zipCount = 0;

for (const vendor of vendors) {
    const vendorSrc = join(source, vendor);
    if (!existsSync(vendorSrc)) {
        console.warn(`sync-labs: missing vendor dir ${vendorSrc}, skipping`);
        continue;
    }
    const slugs = labDirs(vendorSrc);
    const contentVendor = join(contentDest, vendor);
    const publicVendor = join(publicDest, vendor);
    pruneStale(contentVendor, new Set([...slugs, "README.md"]));
    pruneStale(publicVendor, new Set(slugs));
    mkdirSync(contentVendor, { recursive: true });

    const guide = join(vendorSrc, "README.md");
    if (existsSync(guide)) {
        cpSync(guide, join(contentVendor, "README.md"));
    }

    for (const slug of slugs) {
        const labSrc = join(vendorSrc, slug);
        const labDest = join(contentVendor, slug);
        rmSync(labDest, { recursive: true, force: true });
        cpSync(labSrc, labDest, { recursive: true });

        const assetDir = join(publicVendor, slug);
        mkdirSync(assetDir, { recursive: true });

        const files = walk(labSrc);
        const solutionFiles = files.filter(isSolutionFile);
        const expected = new Set([`${slug}.zip`]);

        if (files.includes("topology.png")) {
            cpSync(join(labSrc, "topology.png"), join(assetDir, "topology.png"));
            expected.add("topology.png");
        }
        if (solutionFiles.length > 0) {
            expected.add(`${slug}-solutions.zip`);
        }

        const labZip = join(assetDir, `${slug}.zip`);
        const solutionsZip = join(assetDir, `${slug}-solutions.zip`);
        if (
            writeBundle(
                labZip,
                labSrc,
                slug,
                files.filter((file) => !isSolutionFile(file)),
            )
        ) {
            zipCount += 1;
        }
        if (writeBundle(solutionsZip, labSrc, slug, solutionFiles)) {
            zipCount += 1;
        }
        pruneStale(assetDir, expected);
        labCount += 1;
    }
}

console.log(`sync-labs: ${labCount} labs synced, ${zipCount} bundles rebuilt`);
