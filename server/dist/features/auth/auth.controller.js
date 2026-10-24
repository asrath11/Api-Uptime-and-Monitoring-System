import { asyncWrapper } from "../../utils/asyncWrapper.js";
import User from "./auth.model.js";
import { generateToken, clearToken } from "../../utils/jwt.js";
export const register = asyncWrapper(async (req, res) => {
    const { name, email, password } = req.body;
    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
        return res.status(400).json({
            success: false,
            message: "User already exists",
        });
    }
    const user = await User.create({ name, email, password });
    generateToken(res, user._id.toString());
    res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        },
    });
});
export const login = asyncWrapper(async (req, res) => {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email }).select("+password");
    const isPasswordMatched = user && (await user.comparePassword(password));
    if (!user || !isPasswordMatched) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    }
    generateToken(res, user._id.toString(), remember);
    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        },
    });
});
export const getCurrentUser = asyncWrapper(async (req, res) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Not authorized",
        });
        return;
    }
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
        },
    });
});
export const logout = asyncWrapper(async (req, res) => {
    clearToken(res);
    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});
//# sourceMappingURL=auth.controller.js.map