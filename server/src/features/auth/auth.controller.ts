import { Request, Response } from "express";
import { RegisterInput, LoginInput } from "@/features/auth/auth.schema.js";
import { asyncWrapper } from "@/utils/asyncWrapper.js";
import User from "@/features/auth/auth.model.js";
import { generateToken, clearToken } from "@/utils/jwt.js";

export const register = asyncWrapper(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

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

export const login = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password, remember } = req.body as LoginInput;
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

export const getCurrentUser = asyncWrapper(async (req: Request, res: Response) => {
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

export const logout = asyncWrapper(async (req: Request, res: Response) => {
  clearToken(res);
  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});
