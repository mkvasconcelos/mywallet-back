import express from "express";
import { getUser, updateUser } from "../controllers/userController.js";
import {
  validEmail,
  validUpdateUser,
} from "../middlewares/schemaMiddleware.js";
import { validToken } from "../middlewares/tokenMiddleware.js";

const userRouter = express.Router();
userRouter.get("/users", validEmail, validToken, getUser);
userRouter.put("/users", validUpdateUser, validToken, updateUser);

export default userRouter;
