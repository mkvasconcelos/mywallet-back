import express from "express";
import { getUser } from "../controllers/userController.js";
import { validEmail } from "../middlewares/schemaMiddleware.js";

const userRouter = express.Router();
userRouter.get("/users", validEmail, getUser);

export default userRouter;
