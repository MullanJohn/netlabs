import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import type { DragDropQuestion, QuestionOption } from "./types/quiz-types";

type Props = {
    question: DragDropQuestion;
    pairs: Partial<Record<string, string>>;
    onSelect: (pairs: Partial<Record<string, string>>) => void;
};

const DragDropQuestionView = ({ question, pairs, onSelect }: Props) => {
    return (
        <div>
            <h2>{question.stem}</h2>

            <DragDropProvider
                onDragEnd={(event) => {
                    if (event.canceled) return;

                    const { source, target } = event.operation;

                    if (!source?.id || !target?.id) return;

                    const optionId = String(source.id);
                    const targetId = String(target.id);

                    if (
                        targetId !== "options" &&
                        !targetId.startsWith("answer-")
                    ) {
                        return;
                    }

                    if (
                        targetId !== "options" &&
                        pairs[targetId] !== undefined &&
                        pairs[targetId] !== optionId
                    ) {
                        return;
                    }

                    const next = { ...pairs };

                    for (const key in next) {
                        if (next[key] === optionId) {
                            delete next[key];
                        }
                    }

                    if (targetId !== "options") {
                        next[targetId] = optionId;
                    }

                    onSelect(next);
                }}
            >
                <Droppable id="options">
                    {question.options.map((option) => {
                        const isDropped = Object.values(pairs).includes(
                            option.id,
                        );

                        if (isDropped) return null;

                        return (
                            <Draggable key={option.id} id={option.id}>
                                {option.text}
                            </Draggable>
                        );
                    })}
                </Droppable>

                <div>
                    {question.options.map((_, index) => {
                        const boxId = `answer-${index}`;
                        const droppedOption = question.options.find(
                            (option) => option.id === pairs[boxId],
                        );

                        return (
                            <Droppable key={boxId} id={boxId}>
                                {droppedOption ? (
                                    <Draggable id={droppedOption.id}>
                                        {droppedOption.text}
                                    </Draggable>
                                ) : (
                                    <span>Drop here</span>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropProvider>
        </div>
    );
};

export default DragDropQuestionView;

type DroppableProps = {
    id: string;
    children: ReactNode;
};

const Droppable = ({ id, children }: DroppableProps) => {
    const { ref } = useDroppable({ id });

    return (
        <div
            ref={ref}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-900"
        >
            {children}
        </div>
    );
};

type DraggableProps = {
    id: string;
    children: ReactNode;
};

const Draggable = ({ id, children }: DraggableProps) => {
    const { ref } = useDraggable({ id });

    return (
        <button
            ref={ref}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-900"
        >
            {children}
        </button>
    );
};
