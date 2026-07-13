type Props = {
    hasResult: boolean;
    checking: boolean;
    disabled: boolean;
    onClick: () => void;
};

const CheckButton = ({ hasResult, checking, disabled, onClick }: Props) => (
    <button
        className="btn primary"
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-keyshortcuts="Enter"
    >
        {hasResult ? "Checked" : checking ? "Checking…" : "Check answer"}
    </button>
);

export default CheckButton;
