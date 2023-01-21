import db from "../database/database.js";

export async function validToken(req, res, next) {
  const { authorization } = req.headers;
  const { email } = req.headers;
  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({ token });
  if (!session) return res.sendStatus(401);
  const user = await db.collection("users").findOne({
    _id: session.userId,
    email,
  });
  if (!user) return res.sendStatus(401);
  res.locals.user = user;
  next();
}
