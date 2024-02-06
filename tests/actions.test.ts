import { toChangeCoins } from "../src/domain/actions.js";
import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { UserEntity, UsersRepo } from "../src/dal/user.js";

describe("to change coins", () => {
    const tests = [
        { v: 100, r: 0, change: { 100: 1 } },
        { v: 0, r: 0, change: {} },
        { v: 75, r: 0, change: { 50: 1, 20: 1, 5: 1 } },
    ]

    for (const t of tests) {
        it(`for ${t.v} returns r=${t.r}, change=${JSON.stringify(t.change)}`, () => {
            const [change, rem] = toChangeCoins(t.v);
            expect(rem).toEqual(t.r);
            expect(change).toEqual(t.change);
        });
    }
});

describe("user repo", () => {
    let db: Database;
    let usersRepo: UsersRepo;
    beforeAll(async () => {
        db = await open({
            filename: ":memory:",
            driver: sqlite3.Database,
        });
        await db.migrate({
            migrationsPath: "./migrations/users",
        });
        usersRepo = new UsersRepo(db);
    });
    afterAll(async () => {
        await db.close();
    });

    let id: string;
    let userData: Omit<UserEntity, "id"> = {
        deposit: 0,
        name: "test",
        passhash: "123",
        passsalt: "333",
        role: "buyer",
    };
    it("create user", async () => {
        id = await usersRepo.create(userData);
    });

    it("read user", async () => {
        const user = await usersRepo.get(id);

        expect(user).toEqual({
            id: id,
            ...userData
        });
    });

    it("deposit 10", async () => {
        const deposit = await usersRepo.addDeposit(id, 10);

        expect(deposit.deposit).toEqual(10);
    });

    it("read user after deposit has 10 in deposit", async () => {
        const user = await usersRepo.get(id);

        expect(user).toEqual({
            id: id,
            ...userData,
            deposit: 10,
        });
    });

    it("reset deposit", async () => {
        await usersRepo.resetDeposit(id);
    });

    it("read user after deposit has 0 in deposit", async () => {
        const user = await usersRepo.get(id);

        expect(user).toEqual({
            id: id,
            ...userData,
            deposit: 0,
        });
    });
});