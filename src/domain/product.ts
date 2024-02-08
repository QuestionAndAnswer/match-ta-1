import { Request, Router } from "express";
import { isRecordObj } from "../utils.js";
import { ProductRepo } from "../dal/product.js";
import validator from "validator";
import { authn, authz } from "./auth.js";


export interface ProductBodyDto {
    amount: number;
    cost: number;
    name: string;
}

export function validateId(id: unknown) {
    if (typeof id === "string" && !validator.isUUID(id)) return new Error("id must be a valid UUID");
    return id as string;
}

export function validateProductDto(dto: unknown) {
    if (!dto) return new Error("empty payload received");
    if (!isRecordObj(dto)) return new Error("is not an object");

    if (typeof dto.name !== "string") return new Error(".name is not a string");
    if (dto.name.length < 2) return new Error(".name must be at least 2 symbols");

    if (typeof dto.amount !== "number") return new Error(".amount is not a number type");
    if (!Number.isInteger(dto.amount)) return new Error(".amount is not an integer type");
    if (dto.amount < 0) return new Error(".amount must be zero or positive number");

    if (typeof dto.cost !== "number") return new Error(".cost is not a number type");
    if (!Number.isInteger(dto.cost)) return new Error(".cost is not an integer type");
    if (dto.cost < 0) return new Error(".amount must be zero or positive number");
    if (dto.cost % 5 !== 0) return new Error(".cost must be multiple of 5");

    return dto as unknown as ProductBodyDto;
}

export function validateCreateReq(req: Pick<Request, "body">) {
    const dto = validateProductDto(req.body);
    if (dto instanceof Error) return dto;

    return { dto };
}

export function validateUpdateReq(req: Pick<Request, "body" | "params">) {
    const id = validateId(req.params.id);
    if (id instanceof Error) return id;

    const dto = validateProductDto(req.body);
    if (dto instanceof Error) return dto;

    return { id, dto };
}

export function createProductRouter(repo: ProductRepo) {
    const app = Router();

    app.post("/products", authn(), authz("seller"), async (req, res) => {
        const vres = validateCreateReq(req);
        if (vres instanceof Error) return res.status(400).send(vres);

        const { dto } = vres;

        const id = await repo.create({
            ...dto,
            sellerId: req.user!.id
        });

        res.status(201).json({ id: id });
    });

    app.get("/products", async (req, res) => {
        const products = await repo.getAll();

        res.status(200).json(products);
    });

    app.put("/products/:id", authn(), authz("seller"), async (req, res) => {
        const vres = validateUpdateReq(req);
        if (vres instanceof Error) return res.status(400).send(vres);

        const { id, dto } = vres;

        const entity = await repo.get(id);
        if (!entity || entity.sellerId !== req.user?.id) return res.sendStatus(403);

        await repo.update(id, { ...dto, sellerId: entity.sellerId });

        res.sendStatus(200);
    });

    app.delete("/products/:id", authn(), authz("seller"), async (req, res) => {
        const id = req.params.id;
        if (!validator.isUUID(id)) {
            return res.status(400).send("id must be valid UUID");
        }

        const entity = await repo.get(id);
        if (!entity || entity.sellerId !== req.user?.id) return res.sendStatus(403);

        await repo.delete(id);

        res.sendStatus(200);
    });

    return app;
}