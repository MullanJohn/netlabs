export function validateAnswer(
    question: QuizQuestion,
    answer: QuizAnswer,
): string | null {
    switch (question.question_type) {
        case "mcq-single": {
            if (!answer || answer.type !== "mcq-single") {
                return "Please select one option.";
            }

            return null;
        }

        case "mcq-multi": {
            if (!answer || answer.type !== "mcq-multi") {
                return `Please select ${question.select_count} option(s).`;
            }

            if (answer.optionIds.length !== question.select_count) {
                return `Please select exactly ${question.select_count} option(s).`;
            }

            return null;
        }

        case "drag-order": {
            if (!answer || answer.type !== "drag-order") {
                return "Please complete the matching question.";
            }

            const selectedPairCount = Object.keys(answer.pairs).length;
            const requiredPairCount = question.options.length;

            if (selectedPairCount !== requiredPairCount) {
                return "Please match all items before submitting.";
            }

            return null;
        }

        default:
            return "Unsupported question type.";
    }
}

export async function submitAnswer(
    quizId: string,
    questionId: string,
    answer: QuizAnswer,
) {
    console.log("Submitting answer", {
        quizId,
        questionId,
        answer,
    });
    try {
        const response = await fetch(
            `http://192.168.1.113:8080/${quizId}/${questionId}/answer`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(answer),
            },
        );

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("Failed to submit answer:", err);
    }
}
