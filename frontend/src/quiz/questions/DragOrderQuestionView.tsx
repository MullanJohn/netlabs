import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import type { ReactNode } from "react";
import type { DragOrderQuestion } from "../types/quiz-types";
import QuestionPrompt from "./QuestionPrompt";

type Props = {
    question: DragOrderQuestion;
    pairs: Partial<Record<string, string>>;
    onSelect: (pairs: Partial<Record<string, string>>) => void;
};

const DragOrderQuestionView = ({ question, pairs, onSelect }: Props) => {
    const placedCount = Object.values(pairs).filter(Boolean).length;
    const remaining = question.options.length - placedCount;

    return (
        <>
            <QuestionPrompt
                question={question}
                sub="Drag each item into the correct position."
            />

            <DragDropProvider
                onDragEnd={(event) => {
                    if (event.canceled) return;

                    const { source, target } = event.operation;

                    if (!source?.id || !target?.id) return;

                    const optionId = String(source.id);
                    const targetId = String(target.id);

                    const next: Partial<Record<string, string>> =
                        Object.fromEntries(
                            Object.entries(pairs).filter(
                                ([, value]) => value && value !== optionId,
                            ),
                        );

                    if (targetId !== "options") {
                        next[targetId] = optionId;
                    }

                    onSelect(next);
                }}
            >
                <div className="q-dnd">
                    <Droppable id="options" className="q-dnd-bank">
                        <div className="q-dnd-bank-head">
                            <span>Items</span>
                            <span className="remaining">
                                {remaining} of {question.options.length} to place
                            </span>
                        </div>

                        {question.options.map((option) => {
                            const isPlaced = Object.values(pairs).includes(
                                option.id,
                            );

                            if (isPlaced) return null;

                            return (
                                <Chip key={option.id} id={option.id}>
                                    {option.text}
                                </Chip>
                            );
                        })}
                    </Droppable>

                    <div className="q-dnd-slots">
                        {question.options.map((_, index) => {
                            const boxId = `answer-${index}`;
                            const droppedOption = question.options.find(
                                (option) => option.id === pairs[boxId],
                            );

                            return (
                                <Droppable
                                    key={boxId}
                                    id={boxId}
                                    className="q-zone"
                                >
                                    <span className="pos" aria-hidden="true">
                                        {index + 1}
                                    </span>
                                    {droppedOption ? (
                                        <Chip id={droppedOption.id}>
                                            {droppedOption.text}
                                        </Chip>
                                    ) : (
                                        <span className="q-zone-empty">
                                            drop item here
                                        </span>
                                    )}
                                </Droppable>
                            );
                        })}
                    </div>
                </div>
            </DragDropProvider>
        </>
    );
};

export default DragOrderQuestionView;

type DroppableProps = {
    id: string;
    className: string;
    children: ReactNode;
};

const Droppable = ({ id, className, children }: DroppableProps) => {
    const { ref, isDropTarget } = useDroppable({ id });

    return (
        <div ref={ref} className={isDropTarget ? `${className} over` : className}>
            {children}
        </div>
    );
};

type ChipProps = {
    id: string;
    children: ReactNode;
};

const Chip = ({ id, children }: ChipProps) => {
    const { ref, isDragging } = useDraggable({ id });

    return (
        <button
            ref={ref}
            type="button"
            className={isDragging ? "q-chip dragging" : "q-chip"}
        >
            <span className="handle" aria-hidden="true">
                ⋮⋮
            </span>
            <span>{children}</span>
        </button>
    );
};
