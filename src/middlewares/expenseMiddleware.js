import db from "../database/database.js";
import { ObjectId } from "mongodb";

export async function validExpenseId(req, res, next) {
  const { id } = req.params;
  const user = res.locals.user;
  const expenseUser = await db.collection("expenses").findOne({
    _id: ObjectId(id),
  });
  if (!expenseUser) {
    return res.status(404).send("Expense does not exist in our database.");
  } else if (user.email !== expenseUser.email) {
    return res.status(409).send("This expense is not yours.");
  }
  res.locals.expense = expenseUser;
  next();
}
