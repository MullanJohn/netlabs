import type { APIRoute } from "astro";
import { loadQuizQuestionSets } from "../../../../build/db";
import type { QuizQuestion } from "../../../../quiz/types/quiz-types";

type Props = { questions: QuizQuestion[] };

export async function getStaticPaths() {
    const sets = await loadQuizQuestionSets();
    return [...sets].map(([slug, questions]) => ({
        params: { slug },
        props: { questions } satisfies Props,
    }));
}

export const GET: APIRoute<Props> = ({ props }) =>
    Response.json(props.questions);
