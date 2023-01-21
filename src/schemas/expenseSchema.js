import joi from "joi";

export const schemaExpense = joi.object({
  email: joi.string().email().required(),
  value: joi.number().required(),
  description: joi.string().required(),
  status: joi.boolean().strict().required(),
});
