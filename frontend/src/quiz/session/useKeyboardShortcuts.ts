import { useEffect, useLayoutEffect, useRef } from "react";

export type ShortcutMap = Record<string, (event: KeyboardEvent) => void>;

const TEXT_ENTRY =
    'textarea, select, input:not([type="radio"]):not([type="checkbox"]), [contenteditable]:not([contenteditable="false"])';
const ARROW_OWNERS =
    'input, select, [data-arrow-owner], [role="toolbar"], [role="radiogroup"], [role="listbox"], [role="menu"], [role="grid"], [role="tree"]';
const ENTER_OWNERS = 'button, a[href], [role="button"]';

function isArrowKey(key: string): boolean {
    return (
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "ArrowUp" ||
        key === "ArrowDown"
    );
}

export function useKeyboardShortcuts(map: ShortcutMap): void {
    const mapRef = useRef(map);
    useLayoutEffect(() => {
        mapRef.current = map;
    });

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            if (event.isComposing) return;

            const handler = mapRef.current[event.key];
            if (!handler) return;

            const el = event.target instanceof Element ? event.target : null;
            if (el?.closest("dialog[open]")) return;
            if (el?.closest(TEXT_ENTRY)) return;
            if (isArrowKey(event.key) && el?.closest(ARROW_OWNERS)) return;
            if (event.key === "Enter" && el?.closest(ENTER_OWNERS)) return;

            event.preventDefault();
            handler(event);
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);
}
