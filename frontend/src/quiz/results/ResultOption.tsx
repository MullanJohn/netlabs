type Props = {
    letter: string;
    text: string;
    isCorrect: boolean;
    isSelected: boolean;
};

const ResultOption = ({ letter, text, isCorrect, isSelected }: Props) => {
    const state = isCorrect ? "is-correct" : isSelected ? "is-wrong" : "is-muted";
    const mark = isCorrect ? "✓" : isSelected ? "✗" : null;
    const srLabel = isCorrect
        ? "correct answer"
        : isSelected
          ? "your answer, incorrect"
          : null;

    return (
        <div className={`q-opt ${state}`}>
            <span className="k">{letter}</span>
            <span className="txt">{text}</span>
            {srLabel && <span className="visually-hidden">{srLabel}</span>}
            {mark && (
                <span className="verdict-mark" aria-hidden="true">
                    {mark}
                </span>
            )}
        </div>
    );
};

export default ResultOption;
