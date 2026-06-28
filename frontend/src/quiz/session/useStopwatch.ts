import { useEffect, useRef, useState } from "react";

export function useStopwatch(): number {
    const startRef = useRef<number | null>(null);
    const [elapsedMs, setElapsedMs] = useState(0);

    useEffect(() => {
        if (startRef.current === null) startRef.current = performance.now();
        const tick = () => {
            const start = startRef.current;
            if (start !== null) {
                const seconds = Math.floor((performance.now() - start) / 1000);
                setElapsedMs(seconds * 1000);
            }
        };
        tick();
        const id = setInterval(tick, 250);
        return () => clearInterval(id);
    }, []);

    return elapsedMs;
}

export function formatElapsed(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    const pad = (value: number) => String(value).padStart(2, "0");
    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(seconds)}`
        : `${minutes}:${pad(seconds)}`;
}
