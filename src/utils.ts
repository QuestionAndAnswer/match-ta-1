
export type UnknownRecord = Record<number | string | symbol, unknown>;
export function isRecordObj(v: unknown): v is UnknownRecord {
    return typeof v === "object";
}