import { schemaEmail } from "../schemas/userSchema.js";
import db from "../database/database.js";

export async function getUser(req, res) {
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
}
