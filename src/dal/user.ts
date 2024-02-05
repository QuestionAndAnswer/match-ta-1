import { randomUUID } from "crypto";
import { Database } from "sqlite";

export interface UserEntity {
    id: string;
    name: string;
    passhash: string;
    passsalt: string;
    deposit: number;
    role: string;
}

const table = "Users";

export class UsersRepo {
    constructor(
        private readonly db: Database
    ) { }

    async create(entity: Omit<UserEntity, "id">) {
        const id = randomUUID();

        await this.db.run(
            `INSERT INTO ${table} (id, name, passhash, passsalt, deposit, role) 
            VALUES ($id, $name, $passhash, $passsalt, $deposit, $role)`,
            {
                $id: id,
                $name: entity.name,
                $passhash: entity.passhash,
                $passsalt: entity.passsalt,
                $deposit: entity.deposit,
                $role: entity.role
            },
        );
    }

    async findByName(name: string) {
        const res = await this.db.get<UserEntity>(`SELECT * from ${table} WHERE name = ?`, name);

        return res;
    }

    async get(id: string) {
        const res = await this.db.get<UserEntity>(`SELECT * FROM ${table} WHERE id = ?`, id);

        return res;
    }

    async getAll() {
        const res = await this.db.all<UserEntity[]>(`SELECT * FROM ${table}`);

        return res;
    }


    async addDeposit(userId: string, amount: number) {
        const res = await this.db.get<{ deposit: number }>(
            `
            UPDATE ${table} SET deposit = deposit + $amount WHERE id = $userId
            RETURNING deposit;
            `,
            {
                $userId: userId,
                $amount: amount
            }
        );

        return res!;
    }

    async resetDeposit(userId: string) {
        await this.db.run(`UPDATE ${table} SET deposit = 0 WHERE id = ?`, userId);
    }
}