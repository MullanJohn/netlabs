export const LAB_VENDORS = {
    cisco: { slug: "cisco", label: "cisco", name: "Cisco", platform: "IOS" },
    arista: { slug: "arista", label: "arista", name: "Arista", platform: "EOS" },
} as const;

export type LabVendor = keyof typeof LAB_VENDORS;

export const LAB_EXAMS = [
    { id: "ccna", label: "CCNA", pattern: /\bccna\b|200-301/i },
    { id: "encor", label: "ENCOR", pattern: /\bencor\b|350-401/i },
    { id: "enarsi", label: "ENARSI", pattern: /\benarsi\b|300-410/i },
    { id: "ccie", label: "CCIE", pattern: /\bccie\b/i },
    { id: "ace", label: "ACE", pattern: /\bace\b/i },
] as const;

export type LabExamId = (typeof LAB_EXAMS)[number]["id"];

export function examsFor(examMapping: string): LabExamId[] {
    return LAB_EXAMS.filter((exam) => exam.pattern.test(examMapping)).map(
        (exam) => exam.id,
    );
}

export function examLabel(id: string): string {
    return LAB_EXAMS.find((exam) => exam.id === id)?.label ?? id.toUpperCase();
}

const STRUCTURE_TOKENS = new Set([
    "FOUND",
    "ADV",
    "EXP",
    "MOCK",
    "PRAC",
    "CONCEPT",
    "LEG",
    "CAT",
]);

export function topicFor(labCode: string): string {
    return labCode
        .split("-")
        .filter(
            (token) =>
                token.length > 0 &&
                !STRUCTURE_TOKENS.has(token) &&
                !/^\d+[A-Z]?$/.test(token),
        )
        .join(" ")
        .toLowerCase();
}
