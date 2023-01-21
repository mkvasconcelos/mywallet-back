import db from "../database/database.js";

export default async function deleteSessions() {
  const deleteSessions = await db
    .collection("sessions")
    .find({ date: { $lt: Date.now() - 1800000 } })
    .toArray();
  deleteSessions.map(
    async (s) => await db.collection("sessions").deleteOne({ _id: s._id })
  );
}
