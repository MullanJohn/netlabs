type Props = {
    isCorrect: boolean;
    explanation: string;
};

const toParagraphs = (text: string) =>
    text
        .split(/\n\s*\n/)
        .map((para) => para.replace(/\s+/g, " ").trim())
        .filter(Boolean);

const Verdict = ({ isCorrect, explanation }: Props) => (
    <div className={isCorrect ? "verdict ok" : "verdict err"}>
        <h4>
            <span aria-hidden="true">→ </span>
            {isCorrect ? "correct" : "incorrect"}
        </h4>
        {toParagraphs(explanation).map((para, index) => (
            <p key={index}>{para}</p>
        ))}
    </div>
);

export default Verdict;
