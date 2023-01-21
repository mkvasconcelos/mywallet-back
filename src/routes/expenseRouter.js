import express from "express";
import {
  deleteExpenses,
  getExpenses,
  postExpenses,
  updateExpenses,
} from "../controllers/expenseController.js";
import { validEmail, validExpense } from "../middlewares/schemaMiddleware.js";

const expenseRouter = express.Router();

expenseRouter.get("/expenses", validEmail, getExpenses);
expenseRouter.post("/expenses", validExpense, postExpenses);
expenseRouter.delete("/expenses/:id", validEmail, deleteExpenses);
expenseRouter.put("/expenses/:id", validExpense, updateExpenses);

export default expenseRouter;
