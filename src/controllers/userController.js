import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import db from "../database/database.js";

export async function getUser(_, res) {
  const user = res.locals.user;
  delete user.pwd;
  delete user._id;
  let total = user.total;
  if (!user.status) {
    total *= -1;
  }
  return res
    .status(200)
    .send({ name: user.name, email: user.email, total, status: user.status });
}

export async function updateUser(req, res) {
  const user = res.locals.user;
  const { name, oldPwd, newPwd } = req.body;
  if (!bcrypt.compareSync(oldPwd, user.pwd))
    return res.status(403).send("Password wrong.");
  const hashPwd = bcrypt.hashSync(newPwd, 10);
  try {
    await db.collection("users").updateOne(
      { _id: ObjectId(user._id) },
      {
        $set: {
          name,
          pwd: hashPwd,
        },
      }
    );
    return res.status(201).send({ name });
  } catch (err) {
    return res.sendStatus(500);
  }
}
