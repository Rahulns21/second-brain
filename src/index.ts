import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { ContentModel, LinkModel, UserModel } from "./db/db";
import { config } from "./config/config";
import jwt from "jsonwebtoken";
import { userMiddleware } from "./middleware/middleware";
import { Types } from "mongoose";
import { random } from "./utils/utils";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());

app.post("api/v1/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Missing fields required!",
            message: "Username and password are required"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: "Weak password",
            message: "Password must be at least 8 characters long!"
        });
    }

    try {

        const existingUser = await UserModel.findOne({
            username
        });

        if (existingUser) {
            return res.status(422).json({
                error: "Username already taken",
                message: "A user with this username already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await UserModel.create({
            username,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User signed up successfully"
        });
    } catch (e) {
        return res.status(500).json({
            error: "Internal server error",
            message: "Something went wrong during signup"
        });
    }

});

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        res.status(400).json({
            error: "Missing required fields",
            message: "Username and password are required"
        });
        return;
    }

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

    if (!link || !title) {
        return res.status(400).json({
            error: "Missing fields required",
            message: "Link and title fields are required"
        });
    }

    if (!req.userId) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {
        await ContentModel.create({
            link,
            title,
            userId: req.userId,
            tags: []
        });

        return res.json({
            message: "Content added."
        });
    } catch {
        res.status(500).json({
            error: "Internal server error",
            message: "Something went wrong while saving content"
        })
    }
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

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    const userId = new Types.ObjectId(req.userId);

    try {

        // check if share is present in body
        if (!Object.prototype.hasOwnProperty.call(req.body, "share")) {
            return res.status(400).json({
                success: false,
                error: "Missing 'share' field"
            });
        }

        if (typeof share !== "boolean") {
            return res.status(400).json({
                success: false,
                error: "'share' must be a boolean"
            });
        }

        if (share) {
            const existingLink = await LinkModel.findOne({
                userId,
            }).lean();

            if (existingLink) {
                return res.status(409).json({
                    success: false,
                    error: "Couldn't create link, since you already have an existing one",
                    link: `/share/${existingLink.hash}`
                });
            }

            const hash = random(10);

            await LinkModel.create({
                userId,
                hash
            });

            res.status(200).json({
                message: `http://localhost:3000/share/${hash}`
            });
        } else {
            const deletion = await LinkModel.deleteOne({
                userId
            });

            res.status(200).json({
                success: true,
                message: deletion.deletedCount ? "Link removed" : "No link to remove"
            });
        }
    } catch (err) {
        console.log(`POST /api/v1/brain/share error: ${err}`)
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Something went wrong during the process"
        });
    }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;

    try {
        const link = await LinkModel.findOne({
            hash,
        });

        if (!link) {
            return res.status(404).json({
                message: "Link doesn't exist or invalid"
            });
        }

        const content = await ContentModel.find({
            userId: new Types.ObjectId(link.userId)
        });

        console.log(link);

        const user = await UserModel.findOne({
            _id: link.userId
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found!"
            });
        }

        res.json({
            username: user.username,
            content,
        });
    } catch (err) {
        console.log(`GET /api/v1/brain/:shareLink error: ${err}`);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Something went wrong during the process"
        });
    }

});

app.listen(config.PORT);