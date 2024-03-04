import express from "express";
import jwt from "jsonwebtoken";
import { User } from "./models/db.mjs";
import { Strategy } from "passport-facebook";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        secret: "BAOMAT",
        resave: true,
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// xac thuc user
passport.serializeUser(function (user, done) {
    done(null, user);
});

// lay thong tin user
passport.deserializeUser(function (user, done) {
    done(null, user);
});

const port = 3000;

app.get("/", (req, res) => {
    res.json("Hello World!");
});

const createToken = (email) => {
    return jwt.sign({ email }, "BAOMAT", { expiresIn: "1h" });
};

// define facebook strategy
passport.use(
    new Strategy(
        {
            clientID: "7581112768589832",
            clientSecret: "da5e23449227a70c154ae73ef096bb79",
            callbackURL: "http://localhost:3000/auth/facebook/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            const user = await User.findOrCreate({
                where: { email: profile.id },
                defaults: {
                    email: profile.id,
                    password: "123456",
                },
            });
            // send mail password to user
            return done(null, user[0].dataValues);
        }
    )
);

// define google strategy

app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json("Invalid request");
    }
    // check if email exists
    const checkEmail = await User.findOne({ where: { email } });

    if (checkEmail) {
        return res.status(400).json("Email exists");
    }

    const user = await User.create({ email, password });
    res.cookie("auth", createToken(email), {
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
    });
    return res.json(user);
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json("Invalid request");
    }

    const user = await User.findOne({ where: { email } });
    /* this  =>{
			email
			password
		}
	
		 */
    if (!user) {
        return res.status(400).json("Email not found");
    }
    const valid = await user.validPassword(password);

    if (!valid) {
        return res.status(400).json("Invalid password");
    }
    res.cookie("auth", createToken(email), {
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
    });

    return res.json("Login successful");
});

// chuyen qua facebook de login
app.get(
    "/auth/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
);

// sau khi login thanh cong thi se chuyen ve trang web cua minh
app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
        failureRedirect: "/login",
    }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.json("Login successful");
    }
);

// ACL => Access Control List

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
