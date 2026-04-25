import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const samlConfigSchema = Joi.object({
  idp_entity_id: Joi.string().trim().max(500).required(),
  idp_sso_url: Joi.string().trim().uri().max(500).required(),
  idp_certificate: Joi.string().trim().required(),
  sp_entity_id: Joi.string().trim().max(500).required(),
  acs_url: Joi.string().trim().uri().max(500).required(),
});

const oidcConfigSchema = Joi.object({
  discovery_url: Joi.string().trim().uri().max(500).required(),
  client_id: Joi.string().trim().max(255).required(),
  client_secret: Joi.string().trim().max(500).required(),
});

const configureSsoSchema = Joi.object({
  protocol: Joi.string().valid("SAML", "OIDC").required(),
  idpName: Joi.string().trim().max(100).required(),
  jitEnabled: Joi.boolean().required(),
  samlConfig: Joi.when("protocol", {
    is: "SAML",
    then: samlConfigSchema.required(),
    otherwise: Joi.forbidden(),
  }),
  oidcConfig: Joi.when("protocol", {
    is: "OIDC",
    then: oidcConfigSchema.required(),
    otherwise: Joi.forbidden(),
  }),
});

const ssoAuthSchema = Joi.object({
  email: Joi.string().trim().email().max(255).required(),
});

export function validateConfigureSso(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = configureSsoSchema.validate(req.body, { abortEarly: false });

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

export function validateSsoAuth(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = ssoAuthSchema.validate(req.query, { abortEarly: false });

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
