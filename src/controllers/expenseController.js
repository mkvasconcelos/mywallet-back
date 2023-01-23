import db from "../database/database.js";
import { ObjectId } from "mongodb";

export async function getExpenses(_, res) {
  const { email } = res.locals.user;
  try {
    const expenses = await db
      .collection("expenses")
      .find({
        email,
      })
      .sort({ date: -1 })
      .toArray();
    return res.status(200).send(expenses);
  } catch (err) {
    return res.sendStatus(422);
  }
}

export async function postExpenses(req, res) {
  const user = res.locals.user;
  const { value, description, status, date } = req.body;
  const newValue = Number(value);
  try {
    await db.collection("expenses").insertOne({
      email: user.email,
      value: newValue,
      description,
      status,
      date: new Date(Date.parse(date)),
    });
    await db.collection("users").updateOne(
      { _id: ObjectId(user._id) },
      {
        $inc: {
          total: status ? newValue : -value,
        },
        $set: {
          status: user.total + (status ? 1 : -1) * newValue >= 0 ? true : false,
        },
      }
    );
    return res.sendStatus(201);
  } catch {
    return res.sendStatus(500);
  }
}

export async function deleteExpenses(_, res) {
  const { user, expense } = res.locals;
  try {
    await db.collection("expenses").deleteOne({ _id: ObjectId(expense._id) });
    await db.collection("users").updateOne(
      { _id: ObjectId(user._id) },
      {
        $inc: {
          total: !expense.status ? expense.value : -expense.value,
        },
        $set: {
          status:
            user.total + (!expense.status ? 1 : -1) * expense.value >= 0
              ? true
              : false,
        },
      }
    );
    const expenses = await db
      .collection("expenses")
      .find({
        email: user.email,
      })
      .sort({ date: -1 })
      .toArray();
    return res.status(200).send(expenses);
  } catch (err) {
    return res.sendStatus(422);
  }
}

export async function updateExpenses(req, res) {
  const { user, expense } = res.locals;
  const { value, description, date } = req.body;
  const newValue = Number(value);
  try {
    await db.collection("expenses").updateOne(
      { _id: ObjectId(expense._id) },
      {
        $set: {
          value: newValue,
          description,
          date: new Date(Date.parse(date)),
        },
      }
    );
    await db.collection("users").updateOne(
      { _id: ObjectId(user._id) },
      {
        $inc: {
          total: expense.status
            ? newValue - expense.value
            : expense.value - newValue,
        },
        $set: {
          status:
            user.total +
              (expense.status ? 1 : -1) * (newValue - expense.value) >=
            0
              ? true
              : false,
        },
      }
    );
    const expenses = await db
      .collection("expenses")
      .find({
        email: user.email,
      })
      .sort({ date: -1 })
      .toArray();
    return res.status(200).send(expenses);
  } catch (err) {
    return res.sendStatus(422);
  }
}
