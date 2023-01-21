import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import db from "../database/database.js";

export async function signIn(req, res) {
  const email = req.headers.email;
  const { pwd } = req.body;
  const token = uuidv4();
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
}

export async function signUp(req, res) {
  const { name, pwd } = req.body;
  const email = req.headers.email;
  const userDuplicate = await db.collection("users").findOne({
    email,
  });
  if (userDuplicate) return res.status(409).send("Email already in use.");
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
}
