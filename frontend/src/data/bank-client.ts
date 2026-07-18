import { staticFetch } from "./api-client";
import type { BankQuestionListResponse } from "./bank-types";

export function fetchBankQuestions(trackSlug: string, signal?: AbortSignal) {
    return staticFetch<BankQuestionListResponse>(
        `/api/banks/${encodeURIComponent(trackSlug)}.json`,
        signal,
    );
}
