import {
  Entity,
  Column,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { BaseEntity } from "./base";
import { Organization } from "./organization";
import { UserCredential } from "./user-credential";
import { UserRole } from "../types";

@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ name: "is_verified", type: "boolean", default: false })
  isVerified: boolean;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date | null;

  @ManyToOne(() => Organization, (org: Organization) => org.users)
  @JoinColumn({ name: "org_id" })
  organization: Organization;

  @OneToOne(() => UserCredential, (credential: UserCredential) => credential.user)
  credential: UserCredential;
}
