import sqlite3 from 'sqlite3';
import { open } from "sqlite";

export async function openUsersDb() {
    const db = await open({
        filename: "./db_data/users",
        driver: sqlite3.Database,
    });

    await db.migrate({
        migrationsPath: "./migrations/users",
    });

    return db;
}

export async function openRestDb() {
    const db = await open({
        filename: "./db_data/rest",
        driver: sqlite3.Database,
    });

    await db.migrate({
        migrationsPath: "./migrations/rest",
    });

    return db;
}