import { Request, Response } from "express";
import { RegisterInput, LoginInput } from "./auth.validation";
import { asyncWrapper } from "../../utils/asyncWrapper";
import { UserModel } from "./auth.model";

export const register = asyncWrapper(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

  const isUserExists = await UserModel.findOne({ email });
  if (isUserExists) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }
  const user = await UserModel.create({ name, email, password })

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

export const signIn = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;
  const user = await UserModel.findOne({ email });
  const isPasswordMatched = user && (await user.comparePassword(password));
  if (!user || !isPasswordMatched) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: user,
  });
});