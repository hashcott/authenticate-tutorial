const express = require("express");
const jwt = require("jsonwebtoken");
const connectDB = require("./db");

const app = express();
app.use(express.json());

const port = 3000;

const db = connectDB();

app.get("/", (req, res) => {
    res.json("Hello World!");
});

const createToken = (email) => {
    return jwt.sign({ email }, "BAOMAT", { expiresIn: "1h" });
};

app.post("/register", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json("Invalid request");
    }
    // check if email exists
    const checkEmail = `SELECT * FROM users WHERE email = '${email}'`;
    db.get(checkEmail, (err, row) => {
        if (err) {
            return res.status(500).json("Server error");
        }
        if (row) {
            return res.status(400).json("Email exists");
        }
    });

    const sql = `INSERT INTO users (email, password) VALUES ('${email}', '${password}')`;
    db.run(sql, (err) => {
        if (err) {
            return res.status(500).json("Server error");
        }
        res.cookie("auth", createToken(email), {
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
        });
        return res.json("Register successful");
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json("Invalid request");
    }
    const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    db.get(sql, (err, row) => {
        if (err) {
            return res.status(500).json("Server error");
        }
        if (!row) {
            return res.status(401).json("Unauthorized");
        }
        res.cookie("auth", createToken(email), {
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
        });
        return res.json("Login successful");
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
