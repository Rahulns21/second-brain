import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { UserModel } from "./db/db";
import { config } from "./config/config";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        await UserModel.create({
            username: username,
            password: password
        });

        res.json({
            message: "User signed up"
        });
    } catch (e) {
        res.status(409).json({
            message: "User already exists"
        })
    }

});

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const existingUser = await UserModel.findOne({
        username,
        password
    });

    if (existingUser) {
        const token = jwt.sign({
            id: existingUser._id
        }, config.JWT_SECRET);

        res.json({
            token
        });
    } else {
        res.status(401).json({
            error: "Invalid credentials"
        });
    }
});

app.post("/api/v1/content",  (req, res) => {
    const link = req.body.link;
    const type = req.body.type;

})

app.get("/api/v1/content", (req, res) => {

});

app.delete("api/v1/content", (req, res) => {

});

app.post("/api/v1/brain/share", (req, res) => {

});

app.get("/api/v1/brain/:shareLink", (req, res) => {

});

app.listen(config.PORT);