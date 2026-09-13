import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { asyncWrapper } from "../utils/asyncWrapper";
import  User from "../features/auth/auth.model";
import { JWT_SECRET } from "../config/consonants";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        name: string;
        email: string;
      };
    }
  }
}

export const authenticateUser = asyncWrapper(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Not authorized",
      });
      return;
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    let decoded: { userId: string };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: "Token expired",
        });
        return;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: "Invalid token",
        });
        return;
      }

      throw error;
    }

    const user = await User.findById(
      decoded.userId,
      "_id name email"
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  }
);