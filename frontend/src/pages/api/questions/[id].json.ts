import type { APIRoute } from "astro";
import { loadAllQuestions } from "../../../build/db";
import type { QuizQuestion } from "../../../quiz/types/quiz-types";

type Props = { question: QuizQuestion };

export async function getStaticPaths() {
    const questions = await loadAllQuestions();
    return questions.map((question) => ({
        params: { id: question.id },
        props: { question } satisfies Props,
    }));
}

export const GET: APIRoute<Props> = ({ props }) =>
    Response.json(props.question);
