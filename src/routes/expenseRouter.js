import express from "express";
import {
  deleteExpenses,
  getExpenses,
  postExpenses,
  updateExpenses,
} from "../controllers/expenseController.js";

const expenseRouter = express.Router();

expenseRouter.get("/expenses", getExpenses);
expenseRouter.post("/expenses", postExpenses);
expenseRouter.delete("/expenses/:id", deleteExpenses);
expenseRouter.put("/expenses/:id", updateExpenses);

export default expenseRouter;
