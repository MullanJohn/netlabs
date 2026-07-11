import { parse } from "yaml";

const DEVICE_KINDS = new Set([
    "cisco_iol",
    "arista_ceos",
    "vr-veos",
    "cisco_c8000v",
]);

export function parseClab(text: string): { deviceCount: number } {
    const doc = parse(text) as Record<string, any> | null;
    const topology = doc?.topology ?? {};
    const defaultKind: string = topology.defaults?.kind ?? "";
    const rawNodes: Record<string, any> = topology.nodes ?? {};

    const deviceCount = Object.values(rawNodes).filter((node) =>
        DEVICE_KINDS.has(node?.kind ?? defaultKind),
    ).length;

    return { deviceCount };
}
