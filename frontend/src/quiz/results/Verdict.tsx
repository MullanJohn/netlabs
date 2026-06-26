type Props = {
    isCorrect: boolean;
    explanation: string;
};

const Verdict = ({ isCorrect, explanation }: Props) => (
    <div className={isCorrect ? "verdict ok" : "verdict err"}>
        <h4>
            <span aria-hidden="true">→ </span>
            {isCorrect ? "correct" : "incorrect"}
        </h4>
        {explanation && <p>{explanation}</p>}
    </div>
);

export default Verdict;
