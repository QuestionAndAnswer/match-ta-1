export interface SQLiteError extends Error {
    code: string;
    errno: number;
}

export function isSQLiteError(err: unknown): err is SQLiteError {
    return err instanceof Error &&
        "code" in err && typeof err.code === "string" &&
        "errno" in err && Number.isInteger(err.errno);
}