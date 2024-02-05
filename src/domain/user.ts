import { Router } from "express";
import { UsersRepo } from "../dal/user.js";
import { hashPassword } from "./password.js";
import { UnknownRecord, isRecordObj } from "../utils.js";
import { isSQLiteError } from "../dal/utils.js";

export interface UserBodyDto {
    name: string;
    deposit: number;
    role: string;
}

export interface CreateUserDto extends UserBodyDto {
    password: string;
}

const allowedRoles = ["buyer"];

export function validateUserBodyDto(dto: unknown) {
    if (!dto) return new Error("empty payload received");
    if (!isRecordObj(dto)) return new Error("is not an object");

    if (typeof dto.name !== "string") return new Error(".name is not a string");
    if (dto.name.length < 2) return new Error(".name must be at least 2 symbols");

    if (
        typeof dto.deposit !== "number" ||
        dto.deposit < 0 ||
        !Number.isInteger(dto.deposit)
    ) return new Error(".deposit must be positive integer number");

    if (
        typeof dto.role !== "string" ||
        !allowedRoles.includes(dto.role)
    ) return new Error(`.role may be one of ${allowedRoles}`);

    return dto as unknown as UserBodyDto & UnknownRecord;
}

export function validateCreateUserDto(dto: unknown) {
    const userDto = validateUserBodyDto(dto);
    if (userDto instanceof Error) return userDto;

    if (typeof userDto.password !== "string") return new Error(".password is not a string");
    if (userDto.password.length < 4) return new Error(".password must be at least 4 symbols");

    return dto as unknown as CreateUserDto & UnknownRecord;
}

export function validateCreateReq(req: Pick<Request, "body">) {
    const dto = validateCreateUserDto(req.body);
    if (dto instanceof Error) return dto;

    return { dto };
}

export function createUserRouter(repo: UsersRepo) {
    const app = Router();

    app.post("/users", async (req, res) => {
        const vres = validateCreateReq(req);
        if (vres instanceof Error) return res.status(400).send(vres.message);

        const { dto } = vres;

        const { salt, hash } = await hashPassword(dto.password);

        try {
            await repo.create({
                name: req.body.name,
                passhash: hash,
                passsalt: salt,
                deposit: dto.deposit,
                role: dto.role
            });
        } catch (err) {
            if (isSQLiteError(err) && err.code === "SQLITE_CONSTRAINT") {
                return res.status(400).send("username already in use");
            }
        }


        res.sendStatus(201);
    });

    app.get("/users", async (req, res) => {
        const users = await repo.getAll();

        res.status(200).json(users.map(x => ({
            name: x.name,
            id: x.id,
        })));
    });

    return app;
}