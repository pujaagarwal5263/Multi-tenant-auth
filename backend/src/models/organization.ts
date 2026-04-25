import { Entity, Column, DeleteDateColumn, OneToMany, OneToOne } from "typeorm";
import { BaseEntity } from "./base";
import { OrgAuthMethod } from "./org-auth-method";
import { OrgSsoConfig } from "./org-sso-config";
import { User } from "./user";

@Entity("organizations")
export class Organization extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 100, unique: true })
  slug: string;

  @Column({ name: "org_code", type: "varchar", length: 6, unique: true })
  orgCode: string;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date | null;

  @OneToMany(() => OrgAuthMethod, (authMethod: OrgAuthMethod) => authMethod.organization)
  authMethods: OrgAuthMethod[];

  @OneToOne(() => OrgSsoConfig, (ssoConfig: OrgSsoConfig) => ssoConfig.organization)
  ssoConfig: OrgSsoConfig;

  @OneToMany(() => User, (user: User) => user.organization)
  users: User[];
}