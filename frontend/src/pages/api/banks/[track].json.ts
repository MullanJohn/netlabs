import type { APIRoute } from "astro";
import { loadBankQuestions } from "../../../build/db";
import { trackSelectors } from "../../../data/track-selectors";
import type { BankQuestionListResponse } from "../../../data/bank-types";

type Props = { bank: BankQuestionListResponse };

export async function getStaticPaths() {
    return Promise.all(
        Object.keys(trackSelectors).map(async (track) => ({
            params: { track },
            props: { bank: await loadBankQuestions(track) } satisfies Props,
        })),
    );
}

export const GET: APIRoute<Props> = ({ props }) => Response.json(props.bank);
