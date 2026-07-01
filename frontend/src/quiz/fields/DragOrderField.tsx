import {
    DragDropProvider,
    DragOverlay,
    PointerSensor,
    useDraggable,
    useDroppable,
} from "@dnd-kit/react";
import { Accessibility, defaultPreset } from "@dnd-kit/dom";
import type { ReactNode } from "react";
import type { DragOrderQuestion, SubmissionResult } from "../types/quiz-types";
import QuestionPrompt from "../questions/QuestionPrompt";
import Verdict from "../results/Verdict";

export const DRAG_HINT = "Drag each item into the correct position.";

const BANK_ID = "options";
const SENSORS = [PointerSensor];
const PLUGINS = defaultPreset.plugins.filter(
    (plugin) => plugin !== Accessibility,
);

type Pairs = Partial<Record<string, string>>;
type GradedResult = Extract<SubmissionResult, { type: "drag-order" }>;

type Base = { question: DragOrderQuestion; pairs: Pairs };
type Props =
    | (Base & { mode: "attempt"; onSelect: (pairs: Pairs) => void })
    | (Base & { mode: "graded"; result: GradedResult });

const DragOrderField = (props: Props) => {
    const { question, pairs } = props;
    const optionText = (id: string | undefined) =>
        question.options.find((option) => option.id === id)?.text ?? "—";

    const slots = question.options.map((_, index) => {
        const boxId = `answer-${index}`;
        const placed = pairs[boxId];

        if (props.mode === "graded") {
            const correct = props.result.correctPairs[boxId];
            const isCorrect = correct !== undefined && placed === correct;

            return (
                <div
                    key={boxId}
                    className={
                        isCorrect ? "q-zone is-correct" : "q-zone is-wrong"
                    }
                >
                    <span className="pos">{index + 1}</span>
                    <ChipBody isStatic>{optionText(placed)}</ChipBody>
                    <span className="verdict-mark" aria-hidden="true">
                        {isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="visually-hidden">
                        {isCorrect ? "correct" : "incorrect"}
                    </span>
                </div>
            );
        }

        const droppedOption = question.options.find(
            (option) => option.id === placed,
        );

        return (
            <Droppable key={boxId} id={boxId} className="q-zone">
                <span className="pos" aria-hidden="true">
                    {index + 1}
                </span>
                {droppedOption ? (
                    <Chip id={droppedOption.id}>{droppedOption.text}</Chip>
                ) : (
                    <span className="q-zone-empty">drop item here</span>
                )}
                <span className="verdict-mark" aria-hidden="true" />
            </Droppable>
        );
    });

    if (props.mode === "graded") {
        const result = props.result;
        const corrections = question.options
            .map((_, index) => {
                const boxId = `answer-${index}`;
                return {
                    index,
                    placed: pairs[boxId],
                    correct: result.correctPairs[boxId],
                };
            })
            .filter(
                ({ placed, correct }) =>
                    correct !== undefined && placed !== correct,
            );

        return (
            <>
                <QuestionPrompt question={question} sub={DRAG_HINT} />
                <div className="q-dnd">
                    <div className="q-dnd-bank" aria-hidden="true">
                        <div className="q-dnd-bank-head">
                            <span>Items</span>
                            <span className="remaining">all placed</span>
                        </div>
                    </div>
                    <div className="q-dnd-slots">{slots}</div>
                </div>
                {corrections.length > 0 && (
                    <div className="q-corrections">
                        <h4>Corrections</h4>
                        <ul>
                            {corrections.map(({ index, placed, correct }) => (
                                <li key={index}>
                                    Position {index + 1}: you placed{" "}
                                    <span className="you">
                                        {optionText(placed)}
                                    </span>
                                    , correct answer is{" "}
                                    <span className="ok">
                                        {optionText(correct)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <Verdict
                    isCorrect={result.isCorrect}
                    explanation={result.explanation}
                />
            </>
        );
    }

    const onSelect = props.onSelect;
    const placedCount = Object.values(pairs).filter(Boolean).length;
    const remaining = question.options.length - placedCount;

    return (
        <>
            <QuestionPrompt question={question} sub={DRAG_HINT} />
            <DragDropProvider
                sensors={SENSORS}
                plugins={PLUGINS}
                onDragEnd={(event) => {
                    if (event.canceled) return;

                    const { source, target } = event.operation;

                    if (!source?.id || !target?.id) return;

                    const optionId = String(source.id);
                    const targetId = String(target.id);

                    const next: Pairs = Object.fromEntries(
                        Object.entries(pairs).filter(
                            ([, value]) => value && value !== optionId,
                        ),
                    );

                    if (targetId !== BANK_ID) {
                        next[targetId] = optionId;
                    }

                    onSelect(next);
                }}
            >
                <div className="q-dnd">
                    <Droppable id={BANK_ID} className="q-dnd-bank">
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

                    <div className="q-dnd-slots">{slots}</div>
                </div>

                <DragOverlay>
                    {(source) => {
                        const option = question.options.find(
                            (item) => item.id === String(source.id),
                        );
                        return option ? (
                            <ChipBody decorative>{option.text}</ChipBody>
                        ) : null;
                    }}
                </DragOverlay>
            </DragDropProvider>
        </>
    );
};

export default DragOrderField;

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

type ChipBodyProps = {
    children: ReactNode;
    elementRef?: (element: Element | null) => void;
    dragging?: boolean;
    decorative?: boolean;
    isStatic?: boolean;
};

const ChipBody = ({
    children,
    elementRef,
    dragging,
    decorative,
    isStatic,
}: ChipBodyProps) => (
    <div
        ref={elementRef}
        className={`q-chip${dragging ? " dragging" : ""}${
            isStatic ? " is-static" : ""
        }`}
        aria-hidden={decorative || undefined}
    >
        <span className="handle" aria-hidden="true">
            ⋮⋮
        </span>
        <span>{children}</span>
    </div>
);

type ChipProps = {
    id: string;
    children: ReactNode;
};

const Chip = ({ id, children }: ChipProps) => {
    const { ref, isDragSource } = useDraggable({ id });

    return (
        <ChipBody elementRef={ref} dragging={isDragSource}>
            {children}
        </ChipBody>
    );
};
