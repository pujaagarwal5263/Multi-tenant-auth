import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { UserRole } from "../types";

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  email: Joi.string().trim().email().max(255).required(),
  role: Joi.string().valid(...Object.values(UserRole)).required(),
  orgId: Joi.string().trim().length(6).uppercase().required()
    .messages({ "string.length": "orgId must be a 6-character organization code" }),
});

export function validateCreateUser(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });

  if (error) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((d) => d.message),
    });
    return;
  }

  req.body = value;
  next();
}
