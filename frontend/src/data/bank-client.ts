import { apiFetch } from "./api-client";
import type { BankQuestionListResponse } from "./bank-types";

export function fetchBankQuestions(trackSlug: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ track: trackSlug });
    return apiFetch<BankQuestionListResponse>(`/questions?${params}`, {
        signal,
    });
}
