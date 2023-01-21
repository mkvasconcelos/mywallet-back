import express from "express";
import { signIn, signUp } from "../controllers/authController.js";
import { validLogin, validUser } from "../middlewares/schemaMiddleware.js";

const authRouter = express.Router();
authRouter.post("/sign-in", validLogin, signIn);
authRouter.post("/sign-up", validUser, signUp);

export default authRouter;
