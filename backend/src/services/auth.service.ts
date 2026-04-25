import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { UserCredential } from "../models/user-credential";
import { AuthMethod } from "../types";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { UserService } from "./user.service";

const SALT_ROUNDS = 10;

export class AuthService {
  private credentialRepository = AppDataSource.getRepository(UserCredential);
  private userService = new UserService();

  async setPassword(email: string, password: string): Promise<void> {
    // Find user with PASSWORD auth method check
    const result = await this.userService.findUserWithAuthMethod(email, AuthMethod.PASSWORD);

    if (!result) {
      throw new Error("User not found");
    }

    if (!result.authMethodEnabled) {
      throw new Error("Password authentication is not enabled for this organization");
    }

    const { user } = result;

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Upsert credential (create or update)
    const existingCredential = await this.credentialRepository.findOne({
      where: { userId: user.id },
    });

    if (existingCredential) {
      existingCredential.passwordHash = passwordHash;
      await this.credentialRepository.save(existingCredential);
    } else {
      const credential = this.credentialRepository.create({
        userId: user.id,
        passwordHash,
      });
      await this.credentialRepository.save(credential);
    }
  }

  async loginWithPassword(
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Find user with PASSWORD auth method check
    const result = await this.userService.findUserWithAuthMethod(email, AuthMethod.PASSWORD);

    if (!result) {
      throw new Error("User not found");
    }

    if (!result.authMethodEnabled) {
      throw new Error("Password authentication is not enabled for this organization");
    }

    const { user } = result;

    if (!user.credential) {
      throw new Error("Password not set for this user");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.credential.passwordHash);
    if (!isValid) {
      throw new Error("Invalid password");
    }

    // Generate tokens (only userId in payload, no PII)
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
