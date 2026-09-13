import { Request, Response } from "express";
import { RegisterInput, LoginInput } from "./auth.validation";
import { asyncWrapper } from "../../utils/asyncWrapper";
import User from "./auth.model";
import { generateToken } from "../../utils/jwt";

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
  const token = generateToken(res, user._id.toString());

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
  });
});

export const signIn = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const user = await User.findOne({ email }).select("+password");
  const isPasswordMatched = user && (await user.comparePassword(password));
  if (!user || !isPasswordMatched) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
  const token = generateToken(res, user._id.toString());
  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    token,
  });
});