import { Entity, Column, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base";
import { Organization } from "./organization";
import { SsoProtocol, SamlConfig, OidcConfig } from "../types";

@Entity("org_sso_config")
export class OrgSsoConfig extends BaseEntity {
  @Column({ type: "enum", enum: SsoProtocol })
  protocol: SsoProtocol;

  @Column({ name: "idp_name", type: "varchar", length: 100 })
  idpName: string;

  @Column({ name: "saml_config", type: "jsonb", nullable: true })
  samlConfig: SamlConfig | null;

  @Column({ name: "oidc_config", type: "jsonb", nullable: true })
  oidcConfig: OidcConfig | null;

  @Column({ name: "jit_enabled", type: "boolean", default: false })
  jitEnabled: boolean;

  @OneToOne(() => Organization, (org: Organization) => org.ssoConfig)
  @JoinColumn({ name: "org_id" })
  organization: Organization;
}