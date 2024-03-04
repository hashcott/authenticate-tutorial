import { Sequelize, DataTypes } from "sequelize";
import bcrypt from "bcrypt";

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./db.sqlite",
});

// define user model
export const User = sequelize.define("user", {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

User.addHook("beforeCreate", (user) => {
    user.password = bcrypt.hashSync(user.password, 10);
});

// define method to check password
User.prototype.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

// sync model with database
sequelize
    .sync({
        force: process.env.NODE_ENV === "staging" ? true : false,
    })
    .then(() => {
        console.log("Database & tables created!");
    });
