import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { OtpCode } from "../models/otp-code";
import { User } from "../models/user";
import { AuthMethod, OtpPurpose } from "../types";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { UserService } from "./user.service";
import { EmailService } from "./email.service";

const OTP_EXPIRY_MINUTES = 5;
const SALT_ROUNDS = 10;

export class OtpService {
  private otpRepository = AppDataSource.getRepository(OtpCode);
  private userService = new UserService();
  private emailService = new EmailService();

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(email: string): Promise<void> {
    const result = await this.userService.findUserWithAuthMethod(email, AuthMethod.OTP);

    if (!result) {
      throw new Error("User not found");
    }

    if (!result.authMethodEnabled) {
      throw new Error("OTP authentication is not enabled for this organization");
    }

    const { user } = result;

    const otp = this.generateOtp();
    const codeHash = await bcrypt.hash(otp, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otpCode = this.otpRepository.create({
      codeHash,
      purpose: OtpPurpose.LOGIN,
      expiresAt,
      user,
    });

    await this.otpRepository.save(otpCode);

    await this.emailService.sendOtpEmail(email, otp);
  }

  async verifyOtp(
    email: string,
    otp: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const result = await this.userService.findUserWithAuthMethod(email, AuthMethod.OTP);

    if (!result) {
      throw new Error("User not found");
    }

    if (!result.authMethodEnabled) {
      throw new Error("OTP authentication is not enabled for this organization");
    }

    const { user } = result;

    const otpCodes = await this.otpRepository.find({
      where: {
        user: { id: user.id },
        purpose: OtpPurpose.LOGIN,
        usedAt: undefined,
      },
      order: { createdAt: "DESC" },
      take: 5,
    });

    let validOtp: OtpCode | null = null;

    for (const otpCode of otpCodes) {
      if (otpCode.expiresAt < new Date()) {
        continue;
      }

      const isValid = await bcrypt.compare(otp, otpCode.codeHash);
      if (isValid) {
        validOtp = otpCode;
        break;
      }
    }

    if (!validOtp) {
      throw new Error("Invalid or expired OTP");
    }

    validOtp.usedAt = new Date();
    await this.otpRepository.save(validOtp);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
