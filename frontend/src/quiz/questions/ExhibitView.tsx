import type { Exhibit } from "../types/quiz-types";

const EXHIBIT_TITLES: Record<string, string> = {
    "config-snippet": "config",
    "show-output": "show output",
    "code-snippet": "code",
    "topology-table": "topology",
    "diagram-mermaid": "diagram",
    "diagram-png": "diagram",
};

const TERMINAL_TYPES = new Set<Exhibit["type"]>([
    "config-snippet",
    "show-output",
    "code-snippet",
]);

type Props = {
    exhibit: Exhibit;
};

const ExhibitView = ({ exhibit }: Props) => {
    const isTerminal = TERMINAL_TYPES.has(exhibit.type);
    const noWrap = isTerminal || exhibit.type === "topology-table";
    const title =
        EXHIBIT_TITLES[exhibit.type] ?? exhibit.type.replaceAll("-", " ");

    return (
        <figure
            className="exhibit"
            role="figure"
            aria-label={`${title} exhibit`}
        >
            <div className="exhibit-head">
                {isTerminal && (
                    <div className="lights" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>
                )}
                <span className="title">{title}</span>
                <span className="meta">{exhibit.type.replaceAll("-", " ")}</span>
            </div>
            <pre className={noWrap ? "exhibit-body" : "exhibit-body wrap"}>
                {exhibit.content}
            </pre>
        </figure>
    );
};

export default ExhibitView;
