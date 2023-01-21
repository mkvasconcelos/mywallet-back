import dayjs from "dayjs";
import { schemaEmail } from "../schemas/userSchema.js";
import { schemaExpense } from "../schemas/expenseSchema.js";
import db from "../database/database.js";
import { ObjectId } from "mongodb";

export async function getExpenses(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({ token });
  if (!session) {
    return res.sendStatus(401);
  }
  const email = req.headers.email;
  const { error } = schemaEmail.validate({ email });
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp)
    return res.status(404).send("Email does not exist in our database.");
  try {
    const expenses = await db
      .collection("expenses")
      .find({
        email,
      })
      .toArray();
    return res.status(200).send(expenses);
  } catch (err) {
    return res.sendStatus(422);
  }
}

export async function postExpenses(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({ token });
  if (!session) {
    return res.sendStatus(401);
  }
  const { value, description, status } = req.body;
  const newValue = Number(value);
  const email = req.headers.email;
  const { error } = schemaExpense.validate(
    { email, value: newValue, description, status },
    { abortEarly: true }
  );
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp)
    return res.status(404).send("Email does not exist in our database.");
  try {
    await db.collection("expenses").insertOne({
      email,
      value: newValue,
      description,
      status,
      date: dayjs().format("DD/MM"),
    });
    await db.collection("users").updateOne(
      { _id: ObjectId(userSignUp._id) },
      {
        $inc: {
          total: status ? value : -value,
        },
        $set: {
          status:
            userSignUp.total + (status ? 1 : -1) * value >= 0 ? true : false,
        },
      }
    );
    return res.sendStatus(201);
  } catch (err) {
    return res.sendStatus(422);
  }
}

export async function deleteExpenses(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({ token });
  if (!session) {
    return res.sendStatus(401);
  }
  const { id } = req.params;
  const email = req.headers.email;
  const { error } = schemaEmail.validate({ email });
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp)
    return res.status(404).send("Email does not exist in our database.");
  const expenseUser = await db.collection("expenses").findOne({
    _id: ObjectId(id),
  });
  if (email !== expenseUser.email)
    return res.status(409).send("This expense is not yours.");
  try {
    await db.collection("expenses").deleteOne({ _id: ObjectId(id) });
    await db.collection("users").updateOne(
      { _id: ObjectId(userSignUp._id) },
      {
        $inc: {
          total: !expenseUser.status ? expenseUser.value : -expenseUser.value,
        },
        $set: {
          status:
            userSignUp.total +
              (!expenseUser.status ? 1 : -1) * expenseUser.value >=
            0
              ? true
              : false,
        },
      }
    );
    const expenses = await db
      .collection("expenses")
      .find({
        email,
      })
      .toArray();
    return res.status(200).send(expenses);
  } catch (err) {
    return res.sendStatus(422);
  }
}

export async function updateExpenses(req, res) {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({ token });
  if (!session) {
    return res.sendStatus(401);
  }
  const { id } = req.params;
  const { value, description, status } = req.body;
  const email = req.headers.email;
  const { error } = schemaExpense.validate(
    { email, value, description, status },
    { abortEarly: true }
  );
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp)
    return res.status(404).send("Email does not exist in our database.");
  const expenseUser = await db.collection("expenses").findOne({
    _id: ObjectId(id),
  });
  if (email !== expenseUser.email)
    return res.status(409).send("This expense is not yours.");
  try {
    await db.collection("expenses").updateOne(
      { _id: ObjectId(id) },
      {
        $set: {
          value,
          description,
        },
      }
    );
    await db.collection("users").updateOne(
      { _id: ObjectId(userSignUp._id) },
      {
        $inc: {
          total: expenseUser.status
            ? value - expenseUser.value
            : expenseUser.value - value,
        },
        $set: {
          status:
            userSignUp.total +
              (expenseUser.status ? 1 : -1) * (value - expenseUser.value) >=
            0
              ? true
              : false,
        },
      }
    );
    const expenses = await db
      .collection("expenses")
      .find({
        email,
      })
      .toArray();
    return res.status(200).send(expenses);
  } catch (err) {
    return res.sendStatus(422);
  }
}
