import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const setPasswordSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
  password: Joi.string().min(8).max(128).required()
    .messages({ "string.min": "Password must be at least 8 characters" }),
});

const loginWithPasswordSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
  password: Joi.string().required(),
});

const sendOtpSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()
    .messages({ "string.pattern.base": "OTP must be a 6-digit number" }),
});

const getAuthModesSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
});

export function validateSetPassword(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = setPasswordSchema.validate(req.body, { abortEarly: false });

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

export function validateLoginWithPassword(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = loginWithPasswordSchema.validate(req.body, { abortEarly: false });

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

export function validateSendOtp(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = sendOtpSchema.validate(req.body, { abortEarly: false });

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

export function validateVerifyOtp(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = verifyOtpSchema.validate(req.body, { abortEarly: false });

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

export function validateGetAuthModes(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = getAuthModesSchema.validate(req.query, { abortEarly: false });

  if (error) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((d) => d.message),
    });
    return;
  }

  req.query = value;
  next();
}
