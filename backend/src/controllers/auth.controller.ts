import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { OtpService } from "../services/otp.service";
import { UserService } from "../services/user.service";
import { GoogleService } from "../services/google.service";
import { SsoService } from "../services/sso.service";

const authService = new AuthService();
const otpService = new OtpService();
const userService = new UserService();
const googleService = new GoogleService();
const ssoService = new SsoService();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

export class AuthController {
  static async setPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      await authService.setPassword(email, password);

      res.status(200).json({
        success: true,
        message: "Password set successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to set password";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async loginWithPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const tokens = await authService.loginWithPassword(email, password);

      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      res.status(401).json({
        success: false,
        message,
      });
    }
  }

  static async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      await otpService.sendOtp(email);

      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send OTP";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      const tokens = await otpService.verifyOtp(email, otp);

      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OTP verification failed";
      res.status(401).json({
        success: false,
        message,
      });
    }
  }

  static async getAuthModes(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;

      const authMethods = await userService.getAuthMethodsForUser(email);

      if (!authMethods) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { authMethods },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get auth modes";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email is required",
        });
        return;
      }

      const authUrl = await googleService.getAuthUrl(email);
      res.redirect(authUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initiate Google auth";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;

      if (!code || !state) {
        res.redirect(`${FRONTEND_URL}/auth/error?message=Missing+code+or+state`);
        return;
      }

      const tokens = await googleService.handleCallback(code, state);

      // Redirect to frontend with tokens
      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      res.redirect(`${FRONTEND_URL}/auth/success?${params.toString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google authentication failed";
      const encodedMessage = encodeURIComponent(message);
      res.redirect(`${FRONTEND_URL}/auth/error?message=${encodedMessage}`);
    }
  }

  static async ssoAuth(req: Request, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email is required",
        });
        return;
      }

      const authUrl = await ssoService.getAuthUrl(email);
      res.redirect(authUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initiate SSO";
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  static async samlCallback(req: Request, res: Response): Promise<void> {
    try {
      const samlResponse = req.body.SAMLResponse as string;
      const relayState = req.body.RelayState as string | undefined;

      if (!samlResponse) {
        res.redirect(`${FRONTEND_URL}/auth/error?message=Missing+SAML+response`);
        return;
      }

      const tokens = await ssoService.handleSamlCallback(samlResponse, relayState);

      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      res.redirect(`${FRONTEND_URL}/auth/success?${params.toString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SAML authentication failed";
      const encodedMessage = encodeURIComponent(message);
      res.redirect(`${FRONTEND_URL}/auth/error?message=${encodedMessage}`);
    }
  }

  static async oidcCallback(req: Request, res: Response): Promise<void> {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;

      if (!code || !state) {
        res.redirect(`${FRONTEND_URL}/auth/error?message=Missing+code+or+state`);
        return;
      }

      const tokens = await ssoService.handleOidcCallback(code, state);

      const params = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      res.redirect(`${FRONTEND_URL}/auth/success?${params.toString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OIDC authentication failed";
      const encodedMessage = encodeURIComponent(message);
      res.redirect(`${FRONTEND_URL}/auth/error?message=${encodedMessage}`);
    }
  }
}
