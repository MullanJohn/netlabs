import type { BankQuestion } from "../../data/bank-types";

export type BankFilters = {
    domain: string;
    type: string;
    query: string;
};

export type BankSort = "id" | "domain" | "type" | "stem";

export function buildSearchIndex(
    questions: readonly BankQuestion[],
    topicTitles: ReadonlyMap<string, string>,
): Map<string, string> {
    const index = new Map<string, string>();
    for (const question of questions) {
        const title = topicTitles.get(question.sub_topic_id) ?? "";
        index.set(
            question.id,
            `${question.stem} ${question.id} ${question.sub_topic_id} ${title}`.toLowerCase(),
        );
    }
    return index;
}

export function tokenize(query: string): string[] {
    return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

export type BankView = {
    visible: BankQuestion[];
    domainCounts: Map<string, number>;
    typeCounts: Map<string, number>;
};

export function computeBankView(
    questions: readonly BankQuestion[],
    filters: BankFilters,
    searchIndex: ReadonlyMap<string, string>,
): BankView {
    const tokens = tokenize(filters.query);
    const visible: BankQuestion[] = [];
    const domainCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    for (const question of questions) {
        if (tokens.length > 0) {
            const haystack = searchIndex.get(question.id) ?? "";
            if (!tokens.every((token) => haystack.includes(token))) continue;
        }
        const inDomain =
            filters.domain === "all" || question.topic_id === filters.domain;
        const inType =
            filters.type === "all" ||
            question.question_type === filters.type;
        if (inType) {
            domainCounts.set(
                question.topic_id,
                (domainCounts.get(question.topic_id) ?? 0) + 1,
            );
        }
        if (inDomain) {
            typeCounts.set(
                question.question_type,
                (typeCounts.get(question.question_type) ?? 0) + 1,
            );
        }
        if (inDomain && inType) visible.push(question);
    }
    return { visible, domainCounts, typeCounts };
}

export function sortQuestions(
    questions: readonly BankQuestion[],
    sort: BankSort,
): BankQuestion[] {
    const byId = (a: BankQuestion, b: BankQuestion) =>
        a.id.localeCompare(b.id, undefined, { numeric: true });
    const sorted = [...questions];
    switch (sort) {
        case "domain":
            sorted.sort(
                (a, b) =>
                    a.topic_id.localeCompare(b.topic_id, undefined, {
                        numeric: true,
                    }) || byId(a, b),
            );
            break;
        case "type":
            sorted.sort(
                (a, b) =>
                    a.question_type.localeCompare(b.question_type) ||
                    byId(a, b),
            );
            break;
        case "stem":
            sorted.sort((a, b) => a.stem.localeCompare(b.stem) || byId(a, b));
            break;
        default:
            sorted.sort(byId);
    }
    return sorted;
}

export function boostIdMatches(
    questions: readonly BankQuestion[],
    query: string,
): BankQuestion[] {
    const token = query.trim().toLowerCase();
    if (token.length < 2 || /\s/.test(token)) return [...questions];
    const hits: BankQuestion[] = [];
    const rest: BankQuestion[] = [];
    for (const question of questions) {
        if (
            question.id.toLowerCase().startsWith(token) ||
            question.sub_topic_id.toLowerCase().startsWith(token)
        ) {
            hits.push(question);
        } else {
            rest.push(question);
        }
    }
    return hits.length > 0 ? [...hits, ...rest] : rest;
}

export type MatchRange = { start: number; end: number };

export function matchRanges(
    text: string,
    tokens: readonly string[],
): MatchRange[] {
    const lower = text.toLowerCase();
    if (lower.length !== text.length) return [];
    const found: MatchRange[] = [];
    for (const token of tokens) {
        if (!token) continue;
        let from = 0;
        while (true) {
            const at = lower.indexOf(token, from);
            if (at === -1) break;
            found.push({ start: at, end: at + token.length });
            from = at + 1;
        }
    }
    found.sort((a, b) => a.start - b.start || a.end - b.end);
    const merged: MatchRange[] = [];
    for (const range of found) {
        const last = merged[merged.length - 1];
        if (last && range.start <= last.end) {
            last.end = Math.max(last.end, range.end);
        } else {
            merged.push({ ...range });
        }
    }
    return merged;
}

export function snippetStart(
    text: string,
    firstMatch: number,
    lead = 24,
    threshold = 40,
): number {
    if (firstMatch <= threshold) return 0;
    let start = firstMatch - lead;
    while (start < firstMatch && !/\s/.test(text[start - 1] ?? " ")) {
        start++;
    }
    return start;
}
