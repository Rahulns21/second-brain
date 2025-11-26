import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/config";

interface MyJwtPayload extends JwtPayload {
    id: string;
}

export function userMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "No authorization header"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Invalid token format"
        });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as MyJwtPayload;

    if (decoded) {
        req.userId = decoded.id;
        next();
    } else {
        res.status(411).json({
            message: "User not logged in"
        });
    }

}