import express from "express";
import cors from "cors";
import joi from "joi";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
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
  pwd: joi.string().min(4).required(),
  repeatPwd: joi.ref("pwd"),
});

const schemaLogin = joi.object({
  email: joi.string().email().required(),
  pwd: joi.string().min(4).required(),
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

setInterval(async () => {
  const deleteSessions = await db
    .collection("sessions")
    .find({ date: { $lt: Date.now() - 1800000 } })
    .toArray();
  deleteSessions.map(
    async (s) => await db.collection("sessions").deleteOne({ _id: s._id })
  );
}, 60000);

app.get("/users", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({ token });
  if (!session) {
    return res.sendStatus(401);
  }
  const email = req.headers.email;
  const { error } = schemaEmail.validate({
    email,
  });
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp) {
    return res.status(404).send("Email does not exist in our database.");
  } else {
    delete userSignUp.pwd;
    return res.status(200).send(userSignUp);
  }
});

app.post("/users/sign-in", async (req, res) => {
  const email = req.headers.email;
  const { pwd } = req.body;
  const token = uuidv4();
  const { error } = schemaLogin.validate({
    email,
    pwd,
  });
  if (error) return res.status(422).send(error.details[0].message);
  const userSignUp = await db.collection("users").findOne({
    email,
  });
  if (!userSignUp || !bcrypt.compareSync(pwd, userSignUp.pwd))
    return res.status(403).send("Email or password wrong.");
  const userAuthorized = await db.collection("sessions").findOne({
    userId: userSignUp._id,
  });
  if (userAuthorized)
    return res
      .status(200)
      .send({ token: userAuthorized.token, name: userSignUp.name });
  try {
    await db.collection("sessions").insertOne({
      token,
      userId: userSignUp._id,
      date: Date.now(),
    });
    return res.status(201).send({ token, name: userSignUp.name });
  } catch {
    return res.sendStatus(500);
  }
});

app.post("/users/sign-up", async (req, res) => {
  const { name, pwd, repeatPwd } = req.body;
  const email = req.headers.email;
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
  const hashPwd = bcrypt.hashSync(pwd, 10);
  try {
    await db.collection("users").insertOne({
      name,
      email,
      pwd: hashPwd,
      total: 0,
      status: true,
    });
    return res.sendStatus(201);
  } catch (err) {
    return res.sendStatus(422);
  }
});

app.get("/expenses", async (req, res) => {
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
});

app.post("/expenses", async (req, res) => {
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
  const operator = status ? 1 : -1;
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
});

app.delete("/expenses/:id", async (req, res) => {
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
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(422);
  }
});

app.put("/expenses/:id", async (req, res) => {
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
    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(422);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
