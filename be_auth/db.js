const sqlite = require("sqlite3").verbose();

const connectDB = () => {
    const db = new sqlite.Database("db.sqlite", (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log("Connected to the database.");
    });
    db.serialize(() => {
        // create users table
        db.run(
            "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, password TEXT)"
        );

        // delete all users
        db.run("DELETE FROM users");

        // insert admin user
        db.run(
            "INSERT INTO users (email, password) VALUES ('admin@web.com','admin')"
        );
    });
    return db;
};

module.exports = connectDB;
