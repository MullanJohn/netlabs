import type { Exhibit } from "../types/quiz-types";

const EXHIBIT_TITLES: Record<Exhibit["type"], string> = {
    "config-snippet": "config",
    "show-output": "show output",
    text: "note",
};

type Props = {
    exhibit: Exhibit;
};

const ExhibitView = ({ exhibit }: Props) => {
    const isTerminal =
        exhibit.type === "config-snippet" || exhibit.type === "show-output";

    return (
        <figure
            className={`exhibit exhibit-${exhibit.type}`}
            role="figure"
            aria-label={`${EXHIBIT_TITLES[exhibit.type]} exhibit`}
        >
            <div className="exhibit-head">
                {isTerminal && (
                    <div className="lights" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>
                )}
                <span className="title">{EXHIBIT_TITLES[exhibit.type]}</span>
                <span className="meta">{exhibit.type.replace("-", " ")}</span>
            </div>
            <pre className={isTerminal ? "exhibit-body" : "exhibit-body wrap"}>
                {exhibit.content}
            </pre>
        </figure>
    );
};

export default ExhibitView;
