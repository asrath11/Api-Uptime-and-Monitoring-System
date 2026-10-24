import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/consonants.js';
export const generateToken = (res, userId, remember = true) => {
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        ...(remember ? { maxAge: 1000 * 60 * 60 * 24 * 7 } : {}),
        path: "/",
    });
    return token;
};
export const clearToken = (res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(0),
        path: "/",
    });
};
//# sourceMappingURL=jwt.js.map