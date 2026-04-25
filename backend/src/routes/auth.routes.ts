import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateSetPassword, validateLoginWithPassword, validateSendOtp, validateVerifyOtp, validateGetAuthModes } from "../validators/auth.validator";
import { validateSsoAuth } from "../validators/sso.validator";

const router = Router();

router.post("/set-password", validateSetPassword, AuthController.setPassword);
router.post("/login-with-password", validateLoginWithPassword, AuthController.loginWithPassword);
router.post("/send-otp", validateSendOtp, AuthController.sendOtp);
router.post("/verify-otp", validateVerifyOtp, AuthController.verifyOtp);
router.get("/auth-modes", validateGetAuthModes, AuthController.getAuthModes);

// Google OAuth routes
router.get("/google", AuthController.googleAuth);
router.get("/google/callback", AuthController.googleCallback);

// SSO routes
router.get("/sso", validateSsoAuth, AuthController.ssoAuth);
router.post("/sso/saml/callback", AuthController.samlCallback);
router.get("/sso/oidc/callback", AuthController.oidcCallback);

export default router;
