import { schemaExpense } from "../schemas/expenseSchema";
import { schemaEmail, schemaLogin, schemaUser } from "../schemas/userSchema";

export async function validLogin(req, res, next) {
  const email = req.headers.email;
  const { pwd } = req.body;
  const { error } = schemaLogin.validate({ email, pwd });
  if (error) {
    res.status(422).send(error.details[0].message);
  }
  next();
}

export async function validUser(req, res, next) {
  const email = req.headers.email;
  const { name, pwd, repeatPwd } = req.body;
  const { error } = schemaUser.validate(
    { name, email, pwd, repeatPwd },
    { abortEarly: true }
  );
  if (error) {
    res.status(422).send(error.details[0].message);
  }
  next();
}

export async function validEmail(req, res, next) {
  const email = req.headers.email;
  const { error } = schemaEmail.validate({ email });
  if (error) {
    res.status(422).send(error.details[0].message);
  }
  next();
}

export async function validExpense(req, res, next) {
  const email = req.headers.email;
  const { value, description, status } = req.body;
  const newValue = Number(value);
  const { error } = schemaExpense.validate(
    { email, value: newValue, description, status },
    { abortEarly: true }
  );
  if (error) {
    res.status(422).send(error.details[0].message);
  }
  next();
}
