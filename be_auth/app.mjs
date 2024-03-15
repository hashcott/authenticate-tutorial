import express from "express";

// rewrite http connect
import http from "http";
import { or } from "sequelize";
const app = express();
const server = http.createServer(app);

import { Server } from "socket.io";

const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"],
    },
});

const user = {
    EdVTwrL0i47i7CdRAAAD: {
        usd: 100,
        btc: 10,
    },
};

const orderBook = {
    buy: [
        // {
        //     id: 0,
        //     price: 100,
        //     amount: 3,
        //     user: "EdVTwrL0i47i7CdRAAAD",
        // },
    ],
    sell: [],
};

// order book
// buy 10$ * 3 => 30$
// sell 10$ * 3 => 30$
io.on("connection", (socket) => {
    console.log(socket.id);
    user[socket.id] = {
        usd: 100,
        btc: 10,
    };

    socket.emit("balance", user[socket.id]);
    socket.on("buy", (data) => {
        const { price, amount } = data;
        orderBook.buy.push({
            price,
            amount,
            total: price * amount,
            user: socket.id,
            id: orderBook.buy.length,
        });
        for (let i = 0; i < orderBook.sell.length; i++) {
            const sellOrder = orderBook.sell[i];
            if (sellOrder.user === socket.id) continue;
            // buy all
            const priceSell = sellOrder.price * sellOrder.amount;
            const priceBuy = price * amount;
            if (priceSell === priceBuy) {
                // tru tien va cong btc
                user[socket.id].usd -= priceBuy;
                user[socket.id].btc += amount;

                user[sellOrder.user].usd += priceSell;
                user[sellOrder.user].btc -= sellOrder.amount;

                // xoa order
                orderBook.sell.splice(i, 1);

                // xoa order buy
                orderBook.buy.splice(orderBook.buy.length - 1, 1);
            }
            // gui thong bao cho nguoi mua (chinh minh) va cap nhat so du
            socket.emit("balance", user[socket.id]);

            // gui thong bao cho nguoi ban va cap nhat so du
            io.to(sellOrder.user).emit("balance", user[sellOrder.user]);
        }
        io.emit("sellBook", orderBook.sell);
        io.emit("buyBook", orderBook.buy);
    });

    socket.on("sell", (data) => {
        const { price, amount } = data;
        orderBook.sell.push({
            price,
            amount,
            total: price * amount,
            user: socket.id,
            id: orderBook.sell.length,
        });
        for (let i = 0; i < orderBook.buy.length; i++) {
            const buyOrder = orderBook.buy[i];
            if (buyOrder.user === socket.id) continue;

            // buy all
            const priceBuy = buyOrder.price * buyOrder.amount;
            const priceSell = price * amount;
            if (priceSell === priceBuy) {
                // tru tien va cong btc
                user[socket.id].usd += priceBuy;
                user[socket.id].btc -= amount;

                user[buyOrder.user].usd -= priceBuy;
                user[buyOrder.user].btc += amount;

                orderBook.buy.splice(i, 1);

                // xoa order buy
                orderBook.sell.splice(orderBook.buy.length - 1, 1);
            }
            // gui thong bao cho nguoi ban (chinh minh) va cap nhat so du
            socket.emit("balance", user[socket.id]);

            // gui thong bao cho nguoi mua va cap nhat so du
            io.to(buyOrder.user).emit("balance", user[buyOrder.user]);
        }
        io.emit("sellBook", orderBook.sell);
        io.emit("buyBook", orderBook.buy);
    });
});
const port = 3000;
server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
