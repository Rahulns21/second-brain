import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { ContentModel, UserModel } from "./db/db";
import { config } from "./config/config";
import jwt from "jsonwebtoken";
import { userMiddleware } from "./middleware/middleware";
import { Types } from "mongoose";

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

app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const { link, title } = req.body;

    if (!req.userId) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    await ContentModel.create({
        link,
        title, 
        userId: req.userId,
        tags: []
    });

    return res.json({
        message: "Content added."
    }); 
});

app.get("/api/v1/content", userMiddleware, async (req, res) => {
    const userId = req.userId;

    if (!req.userId) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const content = await ContentModel.find({
        userId: new Types.ObjectId(userId)
    }).populate("userId", "username");

    return res.json({
        content
    });
});

app.delete("/api/v1/content", userMiddleware, async (req, res) => {
    const contentId = req.body.contentId;

    if (!req.userId) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    if (!contentId) {
        return res.status(401).json({
            message: "ContentId is required"
        })
    }

    const result = await ContentModel.deleteOne({
        _id: new Types.ObjectId(contentId),
        userId: new Types.ObjectId(req.userId)
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({
            message: "Content not found"
        });
    }

    res.json({
        message: "Content deleted successfully"
    });
});

app.post("/api/v1/brain/share", (req, res) => {

});

app.get("/api/v1/brain/:shareLink", (req, res) => {

});

app.listen(config.PORT);