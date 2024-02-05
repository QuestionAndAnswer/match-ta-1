import { RequestHandler, Router } from "express";
import { UsersRepo } from "../dal/user.js";
import { Strategy as LocalStrategy } from "passport-local";
import { isPasswordMatch } from "./password.js";
import passport from "passport";
import type { SessionUser } from "../types.js";

export function createPassportLocalStrategy(repo: UsersRepo) {
    return new LocalStrategy(async (username, password, cb) => {
        try {
            const user = await repo.findByName(username);

            if (!user) return cb(null, false, { message: "Incorrect username or password" });

            const isMatch = await isPasswordMatch(user.passhash, user.passsalt, password);

            if (!isMatch) return cb(null, false, { message: "Incorrect username or password" });

            return cb(null, user);
        } catch (err) {
            cb(err);
        }
    });
}

export function initPassport(usersRepo: UsersRepo) {
    passport.serializeUser<SessionUser>(function (user, cb) {
        console.debug("serialize user", user);
        cb(null, { id: user.id, name: user.name, role: user.role });
    });

    passport.deserializeUser<SessionUser>(function (user, cb) {
        console.debug("deserialize", user);
        cb(null, user);
    });

    passport.use("password", createPassportLocalStrategy(usersRepo));
}

export function authn(): RequestHandler {
    return (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.sendStatus(403);
        }
        next();
    }
}

export function authz(role: string): RequestHandler {
    return (req, res, next) => {
        if (req.user!.role !== role) return res.sendStatus(403);

        next();
    }
}

export function createAuthRouter() {
    const app = Router();

    app.get("/whoami", (req, res) => {
        if (req.isAuthenticated()) {
            return res.status(200).json({
                id: req.user.id,
                name: req.user.name,
                role: req.user.role
            });
        }

        res.status(200).json({});
    });

    app.get("/login/password", passport.authenticate('password', { failureMessage: true }), (req, res) => {
        res.sendStatus(200);
    });

    app.get("/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) { return next(err); }
            res.sendStatus(200);
        });
    });

    return app;
}