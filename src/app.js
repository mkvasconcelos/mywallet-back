import express from "express";
import cors from "cors";
import joi from "joi";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
  await mongoClient.connect();
  db = mongoClient.db();
} catch (error) {
  console.log("mongoClient.connect() error!", error);
}

const schemaUser = joi.object({
  name: joi.string().min(3).required(),
  email: joi.string().email().required(),
  pwd: joi.string().required(),
  repeatPwd: joi.ref("pwd"),
});

const schemaLogin = joi.object({
  email: joi.string().email().required(),
  pwd: joi.string().required(),
});

const schemaEmail = joi.object({
  email: joi.string().email().required(),
});

const schemaExpense = joi.object({
  email: joi.string().email().required(),
  value: joi.number().required(),
  description: joi.string().required(),
  status: joi.boolean().strict().required(),
});

const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/users/sign-in", async (req, res) => {
  const { email, pwd } = req.body;
  const { error } = schemaLogin.validate({
    email,
    pwd,
  });
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp || pwd !== userSignUp.pwd) {
    return res.status(403).send("Email or password wrong.");
  } else {
    return res.sendStatus(200);
  }
});

app.post("/users/sign-up", async (req, res) => {
  const { name, email, pwd, repeatPwd } = req.body;
  const userDuplicate = await db.collection("users").findOne({
    email,
  });
  if (userDuplicate) return res.status(409).send("Email already in use.");
  const { error } = schemaUser.validate(
    {
      name,
      email,
      pwd,
      repeatPwd,
    },
    { abortEarly: true }
  );
  if (error) return res.status(422).send(error.details[0].message);
  try {
    await db.collection("users").insertOne({
      name,
      email,
      pwd,
    });
    return res.sendStatus(201);
  } catch (err) {
    return res.sendStatus(422);
  }
});

app.get("/expenses", async (req, res) => {
  const email = req.headers.email;
  const { error } = schemaEmail.validate({ email });
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp)
    return res.status(422).send("Email does not exist in our database.");
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
});

app.post("/expenses", async (req, res) => {
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
    return res.status(422).send("Email does not exist in our database.");
  try {
    await db.collection("expenses").insertOne({
      email,
      value,
      description,
      status,
    });
    return res.sendStatus(201);
  } catch (err) {
    return res.sendStatus(422);
  }
});

app.delete("/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const email = req.headers.email;
  const { error } = schemaEmail.validate({ email });
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp)
    return res.status(422).send("Email does not exist in our database.");
  const expenseUser = await db.collection("expenses").findOne({
    _id: ObjectId(id),
  });
  console.log(expenseUser);
  if (email !== expenseUser.email)
    return res.status(409).send("This expense is not yours.");
  try {
    await db.collection("expenses").deleteOne({ _id: ObjectId(id) });
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(422);
  }
});

app.put("/expenses/:id", async (req, res) => {
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
    return res.status(422).send("Email does not exist in our database.");
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
          email,
          value,
          description,
          status,
        },
      }
    );
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(422);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
