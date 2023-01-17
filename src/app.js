import express from "express";
import cors from "cors";
import joi from "joi";
import { MongoClient } from "mongodb";
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

const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/users", async (req, res) => {
  const { name, email, pwd, repeatPwd } = req.body;
  const userDuplicate = await db.collection("users").find({
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
  if (error) return res.status(422).send(error.details);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
