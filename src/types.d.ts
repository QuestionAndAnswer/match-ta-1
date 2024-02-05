import { UserEntity } from "./dal/user.ts";

export type SessionUser = Pick<UserEntity, "id" | "name" | "role">;

declare global {
    namespace Express {
        interface User extends SessionUser { }
    }
}