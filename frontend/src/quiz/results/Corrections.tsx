type CorrectionRow = {
    id: string | number;
    label: string;
    picked: string;
    correct: string;
};

type Props = {
    verb: "placed" | "chose";
    rows: CorrectionRow[];
};

const Corrections = ({ verb, rows }: Props) => {
    if (rows.length === 0) return null;

    return (
        <div className="q-corrections">
            <h4>Corrections</h4>
            <ul>
                {rows.map((row) => (
                    <li key={row.id}>
                        {row.label}: you {verb}{" "}
                        <span className="you">{row.picked}</span>, correct
                        answer is <span className="ok">{row.correct}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Corrections;
