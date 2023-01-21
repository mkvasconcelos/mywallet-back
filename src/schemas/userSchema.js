import joi from "joi";

export const schemaLogin = joi.object({
  email: joi.string().email().required(),
  pwd: joi.string().min(4).required(),
});

export const schemaEmail = joi.object({
  email: joi.string().email().required(),
});

export const schemaUser = joi.object({
  name: joi.string().min(3).required(),
  email: joi.string().email().required(),
  pwd: joi.string().min(4).required(),
  repeatPwd: joi.string().required().valid(joi.ref("pwd")),
});

export const schemaUpdateUser = joi.object({
  name: joi.string().min(3).required(),
  oldPwd: joi.string().min(4).required(),
  newPwd: joi.string().min(4).required(),
  repeatNewPwd: joi.string().required().valid(joi.ref("newPwd")),
});
