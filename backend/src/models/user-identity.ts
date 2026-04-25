import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "./base";
import { User } from "./user";

@Entity("user_identities")
@Unique(["provider", "externalId"])
export class UserIdentity extends BaseEntity {
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 100 })
  provider: string;

  @Column({ name: "external_id", type: "varchar", length: 255 })
  externalId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;
}