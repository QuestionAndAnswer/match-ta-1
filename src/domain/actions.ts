import { Router } from "express";
import { authn, authz } from "./auth.js";
import { UnknownRecord, isRecordObj } from "../utils.js";
import { ProductRepo } from "../dal/product.js";
import validator from "validator";
import { UsersRepo } from "../dal/user.js";

export interface DepositDto {
    amount: number;
}

export interface BuyDto {
    productId: string;
    amount: number;
}

const allowedCoins = [5, 10, 20, 50, 100];

export function validateDepositDto(dto: unknown) {
    if (!isRecordObj(dto)) return new Error("not an object");

    if (!Number.isInteger(dto.amount) || !allowedCoins.some(x => dto.amount === x)) return new Error(`.amount must be one of ${allowedCoins} values`);

    return dto as unknown as DepositDto & UnknownRecord;
}

export function validateBuyDto(dto: unknown) {
    if (!isRecordObj(dto)) return new Error("not an object");

    if (!Number.isInteger(dto.amount) || (dto.amount as number) <= 0) return new Error(".amount must be positive non zero integer");

    if (typeof dto.productId !== "string" || !validator.isUUID(dto.productId)) return new Error(".productId is not a valid UUID");

    return dto as unknown as BuyDto & UnknownRecord;
}

export function toChangeCoins(value: number) {
    const change: Record<string, number> = {};

    for (let i = allowedCoins.length - 1; i >= 0; i--) {
        const d = allowedCoins[i];
        const count = Math.floor(value / d);

        if (count > 0) change[d] = count;

        value %= d;
    }

    return [change, value];
}

export function createActionsRoute(usersRepo: UsersRepo, productRepo: ProductRepo) {
    const app = Router();

    app.post("/deposit", authn(), authz("buyer"), async (req, res) => {
        const vres = validateDepositDto(req.body);
        if (vres instanceof Error) return res.status(400).json(vres.message);

        const deposit = await usersRepo.addDeposit(req.user!.id, vres.amount);

        res.status(200).json({ deposit: deposit.deposit });
    });

    app.post("/reset", authn(), authz("buyer"), async (req, res) => {
        await usersRepo.resetDeposit(req.user!.id);

        res.status(200).json({ deposit: 0 });
    });

    app.post("/buy", authn(), authz("buyer"), async (req, res) => {
        // NOTE: Transactionality of some for required, but with SQLite api this is a bit complicated, 
        // and I think I can skip this for the sake of simplicity of this TA.

        const vres = validateBuyDto(req.body);
        if (vres instanceof Error) return res.status(400).json(vres.message);

        const [product, user] = await Promise.all([
            productRepo.get(vres.productId),
            usersRepo.get(req.user!.id)
        ])

        if (!product) return res.status(400).send("product not found");

        if (vres.amount > product?.amount) {
            return res
                .status(400)
                .send(`requested amount (${vres.amount}) is larger than there are products (${product.amount})`);
        }

        const totalProductPrice = product.cost * vres.amount;

        if (user!.deposit < totalProductPrice) {
            return res
                .status(400)
                .send(`insufficient deposit: total required ${totalProductPrice}, deposit ${user!.deposit}`);
        }

        const remaining = user!.deposit - totalProductPrice;

        const [change, rem] = toChangeCoins(remaining);

        product.amount -= vres.amount;

        await Promise.all([
            usersRepo.resetDeposit(req.user!.id),
            productRepo.update(product.id, product)
        ]);

        return res.status(200).json({
            product: {
                id: product.id,
                name: product.name,
                cost: product.cost
            },
            total: totalProductPrice,
            change: change,
            remaining: rem,
        })
    });

    return app;
}