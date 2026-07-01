import { useEffect, useRef, useState } from "react";

export function useStopwatch(): number {
    const startRef = useRef<number | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        startRef.current ??= performance.now();
        const start = startRef.current;
        let id: number;
        const tick = () => {
            const elapsed = performance.now() - start;
            setElapsedSeconds(Math.floor(elapsed / 1000));
            id = window.setTimeout(tick, 1000 - (elapsed % 1000));
        };
        tick();
        return () => clearTimeout(id);
    }, []);

    return elapsedSeconds;
}

export function formatElapsed(totalSeconds: number): string {
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    const pad = (value: number) => String(value).padStart(2, "0");
    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(seconds)}`
        : `${minutes}:${pad(seconds)}`;
}
