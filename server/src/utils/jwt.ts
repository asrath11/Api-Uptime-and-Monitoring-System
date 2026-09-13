import { Response } from "express";
import jwt,{type SignOptions} from 'jsonwebtoken';
import { JWT_SECRET,JWT_EXPIRES_IN} from '../config/consonants';


export const generateToken = (res:Response,userId: string): string => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
  res.cookie("jwt", token, { 
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", 
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    path: "/", 
  });
  return token;
};

export const clearToken = (res: Response): void => {
   res.cookie("jwt", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });
}
