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

export function filterQuestions(
    questions: readonly BankQuestion[],
    filters: BankFilters,
    searchIndex: ReadonlyMap<string, string>,
): BankQuestion[] {
    const tokens = filters.query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
    return questions.filter((question) => {
        if (filters.domain !== "all" && question.topic_id !== filters.domain) {
            return false;
        }
        if (filters.type !== "all" && question.question_type !== filters.type) {
            return false;
        }
        if (tokens.length === 0) return true;
        const haystack = searchIndex.get(question.id) ?? "";
        return tokens.every((token) => haystack.includes(token));
    });
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

export function domainCounts(
    questions: readonly BankQuestion[],
): Map<string, number> {
    const counts = new Map<string, number>();
    for (const question of questions) {
        counts.set(
            question.topic_id,
            (counts.get(question.topic_id) ?? 0) + 1,
        );
    }
    return counts;
}
