export interface SamlConfig {
  idp_entity_id: string;
  idp_sso_url: string;
  idp_certificate: string;
  sp_entity_id: string;
  acs_url: string;
}

export interface OidcConfig {
  discovery_url: string;
  client_id: string;
  client_secret: string;
}

export interface SsoConfigInput {
  protocol: "SAML" | "OIDC";
  idpName: string;
  jitEnabled: boolean;
  samlConfig?: SamlConfig;
  oidcConfig?: OidcConfig;
}
