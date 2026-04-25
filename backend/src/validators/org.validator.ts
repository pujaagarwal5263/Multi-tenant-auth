import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AuthMethod } from "../types";

const createOrgSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(100).required()
    .messages({ "string.pattern.base": "slug must contain only lowercase letters, numbers, and hyphens" }),
  authMethod: Joi.string().valid(...Object.values(AuthMethod)).required(),
});

export function validateCreateOrg(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = createOrgSchema.validate(req.body, { abortEarly: false });

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
