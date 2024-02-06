import express from "express";
import session, { MemoryStore } from "express-session";
import helmet from "helmet";
import { openRestDb, openUsersDb } from "./dal/index.js";
import { createUserRouter } from "./domain/user.js";
import { UsersRepo } from "./dal/user.js";
import { createProductRouter } from "./domain/product.js";
import { ProductRepo } from "./dal/product.js";
import { createAuthRouter, initPassport } from "./domain/auth.js";
import { createActionsRoute } from "./domain/actions.js";
import passport from "passport";

const configs = {
    PORT: 8080,
    SESSION_SECRET: 'keyboard cat',
    // must be true for production. false for manual testing
    SECURE_COOKIES: false,
};

const usersDb = await openUsersDb();
const restDb = await openRestDb();

const usersRepo = new UsersRepo(usersDb);
const productsRepo = new ProductRepo(restDb);


const app = express();

app.use(helmet());
app.use(express.json());

app.set('trust proxy', 1)
app.use(session({
    secret: configs.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "taapp1",
    cookie: {
        secure: configs.SECURE_COOKIES,
        httpOnly: true,
        sameSite: "strict",
        maxAge: 3600 * 1000
    },
    store: new MemoryStore(),
}));

initPassport(usersRepo);

app.use(passport.initialize());
app.use(passport.session());

app.use(createAuthRouter());
app.use(createUserRouter(usersRepo));
app.use(createProductRouter(productsRepo));
app.use(createActionsRoute(usersRepo, productsRepo));


app.listen(configs.PORT, () => {
    console.log("ready");
});