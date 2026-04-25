import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base";
import { User } from "./user";
import { OtpPurpose } from "../types";

@Entity("otp_codes")
export class OtpCode extends BaseEntity {
  @Column({ name: "code_hash", type: "varchar", length: 255 })
  codeHash: string;

  @Column({ type: "enum", enum: OtpPurpose })
  purpose: OtpPurpose;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;

  @Column({ name: "used_at", type: "timestamp", nullable: true })
  usedAt: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;
}
