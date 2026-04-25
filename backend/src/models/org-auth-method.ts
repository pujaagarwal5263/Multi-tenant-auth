import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseEntity } from "./base";
import { Organization } from "./organization";
import { AuthMethod } from "../types";

@Entity("org_auth_methods")
@Unique(["organization", "method"])
export class OrgAuthMethod extends BaseEntity {
  @Column({ type: "enum", enum: AuthMethod })
  method: AuthMethod;

  @Column({ name: "is_enabled", type: "boolean", default: true })
  isEnabled: boolean;

  @ManyToOne(() => Organization, (org: Organization) => org.authMethods)
  @JoinColumn({ name: "org_id" })
  organization: Organization;
}
