import coreJoi from "joi";
import joiDate from "@joi/date";
const joi = coreJoi.extend(joiDate);

export const schemaExpense = joi.object({
  email: joi.string().email().required(),
  value: joi.number().required(),
  description: joi.string().required(),
  status: joi.boolean().strict().required(),
  date: joi.date().format("YYYY-MM-DD").required(),
});
