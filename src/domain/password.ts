import { randomBytes, pbkdf2 } from "crypto";
import { promisify } from "util";

const iterations = 10000;
const keylen = 64;
const digest = "sha512";

export async function hashPassword(password: string) {
    const salt = randomBytes(128).toString('base64');
    const hash = await promisify(pbkdf2)(password, salt, iterations, keylen, digest);

    return {
        salt: salt,
        hash: hash.toString(),
    };
}
export async function isPasswordMatch(savedHash: string, savedSalt: string, passwordAttempt: string) {
    const attemptHash = await promisify(pbkdf2)(passwordAttempt, savedSalt, iterations, keylen, digest);
    return savedHash === attemptHash.toString();
}