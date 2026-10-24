import jwt from "jsonwebtoken";
import { asyncWrapper } from "../utils/asyncWrapper.js";
import User from "../features/auth/auth.model.js";
import { JWT_SECRET } from "../config/consonants.js";
export const requireAuth = asyncWrapper(async (req, res, next) => {
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
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
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
    const user = await User.findById(decoded.userId, "_id name email");
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
});
//# sourceMappingURL=auth.middleware.js.map