import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const hashPassword = (password) => bcrypt.hashSync(password, 10);

export const comparePassword = (password, hash) => bcrypt.compareSync(password, hash);

export const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);
