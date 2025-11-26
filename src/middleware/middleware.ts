import {Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

interface JwtPayloadWithId extends jwt.JwtPayload {
    id: string;
}

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization as string;
    const decoded = jwt.verify(authHeader, config.JWT_SECRET) as JwtPayloadWithId;

    if (!authHeader) {
        res.status(401).json({
            message: "No authorization header"
        });
    }

    const token = authHeader.split(" ")[1];

    if (decoded) {
        req.userId = decoded.id;
        next();
    } else {
        res.status(403).json({
            message: "You are not logged in"
        });
    }
}