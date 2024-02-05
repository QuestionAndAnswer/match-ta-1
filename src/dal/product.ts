import { randomUUID } from "crypto";
import { Database } from "sqlite";

export interface ProductEntity {
    id: string;
    amount: number;
    cost: number;
    name: string;
    sellerId: string;
}

const table = "Products";

export class ProductRepo {
    constructor(private readonly db: Database) { }

    async create(entity: Omit<ProductEntity, "id">) {
        const id = randomUUID();

        await this.db.run(
            `INSERT INTO ${table} (id, amount, cost, name, sellerId)
            VALUES ($id, $amount, $cost, $name, $sellerId)`,
            {
                $id: id,
                $amount: entity.amount,
                $cost: entity.cost,
                $name: entity.name,
                $sellerId: entity.sellerId,
            }
        );

        return id;
    }

    async get(id: string) {
        const res = await this.db.get<ProductEntity>(`SELECT * FROM ${table} WHERE id = ?`, id);

        return res;
    }

    async getAll() {
        const res = await this.db.all<ProductEntity[]>(`SELECT * FROM ${table}`);

        return res;
    }

    async update(id: string, body: Omit<ProductEntity, "id">) {
        await this.db.run(`
            UPDATE ${table} SET
                amount = $amount,
                cost = $cost,
                name = $name,
                sellerId = $sellerId
            WHERE id = $id
        `, {
            $id: id,
            $name: body.name,
            $amount: body.amount,
            $cost: body.cost,
            $sellerId: body.sellerId
        });
    }

    async delete(id: string) {
        await this.db.run(`DELETE FROM ${table} WHERE id = ?`, id);
    }
}