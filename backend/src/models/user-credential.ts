import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base";
import { User } from "./user";

@Entity("user_credentials")
export class UserCredential extends BaseEntity {
  @Column({ name: "user_id", type: "uuid", unique: true })
  userId: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash: string;

  @OneToOne(() => User, (user: User) => user.credential)
  @JoinColumn({ name: "user_id" })
  user: User;
}
