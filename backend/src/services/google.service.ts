import { OAuth2Client } from "google-auth-library";
import { AppDataSource } from "../config/data-source";
import { UserIdentity } from "../models/user-identity";
import { User } from "../models/user";
import { OrgAuthMethod } from "../models/org-auth-method";
import { AuthMethod } from "../types";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;

interface GoogleUserInfo {
  sub: string; // Google's unique user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export class GoogleService {
  private oauth2Client: OAuth2Client;
  private userRepository = AppDataSource.getRepository(User);
  private identityRepository = AppDataSource.getRepository(UserIdentity);
  private authMethodRepository = AppDataSource.getRepository(OrgAuthMethod);

  constructor() {
    this.oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL
    );
  }

  /**
   * Generate Google OAuth consent URL
   * @param email - User's email to encode in state (for verification after callback)
   */
  async getAuthUrl(email: string): Promise<string> {
    // Check user exists and GOOGLE auth is enabled BEFORE redirecting to Google
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["organization"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const authMethod = await this.authMethodRepository.findOne({
      where: {
        organization: { id: user.organization.id },
        method: AuthMethod.GOOGLE,
        isEnabled: true,
      },
    });

    if (!authMethod) {
      throw new Error("Google authentication is not enabled for your organization");
    }

    const state = Buffer.from(JSON.stringify({ email })).toString("base64");

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account", // Always show account picker
    });
  }

  /**
   * Handle OAuth callback - exchange code for tokens and verify user
   */
  async handleCallback(
    code: string,
    state: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Decode state to get original email
    const { email: expectedEmail } = JSON.parse(
      Buffer.from(state, "base64").toString("utf-8")
    );

    // Exchange authorization code for tokens
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.id_token) {
      throw new Error("No ID token received from Google");
    }

    // Verify ID token and get user info
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid ID token payload");
    }

    const googleUser: GoogleUserInfo = {
      sub: payload.sub,
      email: payload.email!,
      email_verified: payload.email_verified || false,
      name: payload.name || "",
      picture: payload.picture,
    };

    // Verify email matches what was requested
    if (googleUser.email.toLowerCase() !== expectedEmail.toLowerCase()) {
      throw new Error(
        `Email mismatch: expected ${expectedEmail}, got ${googleUser.email}`
      );
    }

    if (!googleUser.email_verified) {
      throw new Error("Google email is not verified");
    }

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: googleUser.email },
      relations: ["organization"],
    });

    if (!user) {
      throw new Error("User not found. Please contact your administrator.");
    }

    // Link or verify Google identity
    let identity = await this.identityRepository.findOne({
      where: {
        userId: user.id,
        provider: "GOOGLE",
      },
    });

    if (!identity) {
      // First time Google login - create identity link
      identity = this.identityRepository.create({
        userId: user.id,
        provider: "GOOGLE",
        externalId: googleUser.sub,
      });
      await this.identityRepository.save(identity);
    } else if (identity.externalId !== googleUser.sub) {
      // Google account mismatch
      throw new Error("This account is linked to a different Google account");
    }

    // Mark user as verified if not already
    if (!user.isVerified) {
      user.isVerified = true;
      await this.userRepository.save(user);
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
