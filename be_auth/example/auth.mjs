import express from "express";
import jwt from "jsonwebtoken";
import { User } from "./models/db.mjs";
import { Strategy } from "passport-facebook";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import NodeCache from "node-cache";
import { createClient } from "redis";
import cors from "cors";

// rewrite http connect
import http from "http";
const app = express();
const server = http.createServer(app);

// real time
// socket.io
import { Server } from "socket.io";

const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"],
    },
});
const listOnlines = {};
const listSMS = [];

// init connection
io.on("connection", (socket) => {
    console.log("a user connected");

    socket.emit("listOnlines", Object.values(listOnlines));
    socket.emit("listSMS", listSMS);

    socket.on("disconnect", () => {
        delete listOnlines[socket.id];
        io.emit("listOnlines", Object.values(listOnlines));
        console.log("user disconnected");
    });

    socket.on("sendSMS", (data) => {
        listOnlines[socket.id] = data.user;
        io.emit("listOnlines", Object.values(listOnlines));
        // save to db
        listSMS.push(data);
        io.emit("receiveSMS", data);
    });
});

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    cors({
        origin: "http://127.0.0.1:5500",
        credentials: true,
    })
);

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

const port = 3001;

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

// timeout
const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// lưu trữ dữ liệu vào cache(RAM) để giảm thời gian xử lý
// HẠN CHẾ: không thể lưu quá nhiều dữ liệu, PHỤ THUỘC VÀO KÍCH THƯỚC RAM, không an toàn

// Lưu ý: không nên lưu dữ liệu quá lớn vào cache,
// không dữ liệu thay đổi thường xuyên
// create a new cache
// const myCache = new NodeCache({ stdTTL: 1000000 });
// let data = {};

const redis = await createClient({
    socket: {
        host: "localhost",
        port: 6381,
    },
})
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();

app.get("/fibo/:num", async (req, res) => {
    console.time("fibo");
    let q = req.params.num;
    let tempQ = q;
    //1000 = 7.0330367711422765e+208
    if (await redis.get(tempQ)) {
        console.log("cache");
        console.timeEnd("fibo");
        return res.json((await redis.get(tempQ)).toString());
    }

    // calculate fibo
    // memoization

    let a = 1,
        b = 0,
        temp;
    while (q >= 0) {
        temp = a;
        a = a + b;
        b = temp;
        q--;
    }
    // myCache.set(tempQ, b);
    await redis.set(tempQ, b);
    console.log("new");
    console.timeEnd("fibo");
    return res.json(b.toString());
});

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

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
