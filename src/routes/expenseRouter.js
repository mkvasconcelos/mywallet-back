import express from "express";
import {
  deleteExpenses,
  getExpenses,
  postExpenses,
  updateExpenses,
} from "../controllers/expenseController.js";
import { validExpenseId } from "../middlewares/expenseMiddleware.js";
import { validEmail, validExpense } from "../middlewares/schemaMiddleware.js";
import { validToken } from "../middlewares/tokenMiddleware.js";

const expenseRouter = express.Router();

expenseRouter.get("/expenses", validEmail, validToken, getExpenses);
expenseRouter.post("/expenses", validExpense, validToken, postExpenses);
expenseRouter.delete(
  "/expenses/:id",
  validEmail,
  validToken,
  validExpenseId,
  deleteExpenses
);
expenseRouter.put(
  "/expenses/:id",
  validExpense,
  validToken,
  validExpenseId,
  updateExpenses
);

export default expenseRouter;
