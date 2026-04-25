import * as openidClient from "openid-client";
import { AppDataSource } from "../config/data-source";
import { OrgSsoConfig } from "../models/org-sso-config";
import { OrgAuthMethod } from "../models/org-auth-method";
import { Organization } from "../models/organization";
import { AuthMethod, SsoProtocol, SsoConfigInput, SamlConfig, OidcConfig } from "../types";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

interface SsoConfigResponse {
  id: string;
  protocol: SsoProtocol;
  idpName: string;
  jitEnabled: boolean;
  samlConfig: Partial<SamlConfig> | null;
  oidcConfig: Partial<OidcConfig> | null;
}

export class SsoAdminService {
  private ssoConfigRepository = AppDataSource.getRepository(OrgSsoConfig);
  private authMethodRepository = AppDataSource.getRepository(OrgAuthMethod);
  private orgRepository = AppDataSource.getRepository(Organization);

  async configureSso(orgId: string, input: SsoConfigInput): Promise<OrgSsoConfig> {
    const organization = await this.orgRepository.findOne({
      where: { id: orgId },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Validate config based on protocol
    if (input.protocol === "SAML") {
      if (!input.samlConfig) {
        throw new Error("SAML configuration is required");
      }
      this.validateSamlConfig(input.samlConfig);
    } else if (input.protocol === "OIDC") {
      if (!input.oidcConfig) {
        throw new Error("OIDC configuration is required");
      }
      this.validateOidcConfig(input.oidcConfig);
    }

    // Check if SSO config already exists
    let ssoConfig = await this.ssoConfigRepository.findOne({
      where: { organization: { id: orgId } },
    });

    if (ssoConfig) {
      // Update existing config
      ssoConfig.protocol = input.protocol as SsoProtocol;
      ssoConfig.idpName = input.idpName;
      ssoConfig.jitEnabled = input.jitEnabled;
      ssoConfig.samlConfig = input.protocol === "SAML" ? input.samlConfig! : null;
      ssoConfig.oidcConfig = input.protocol === "OIDC" ? input.oidcConfig! : null;
    } else {
      // Create new config
      ssoConfig = this.ssoConfigRepository.create({
        protocol: input.protocol as SsoProtocol,
        idpName: input.idpName,
        jitEnabled: input.jitEnabled,
        samlConfig: input.protocol === "SAML" ? input.samlConfig! : null,
        oidcConfig: input.protocol === "OIDC" ? input.oidcConfig! : null,
        organization,
      });
    }

    await this.ssoConfigRepository.save(ssoConfig);

    // Enable SSO auth method for the organization
    let authMethod = await this.authMethodRepository.findOne({
      where: {
        organization: { id: orgId },
        method: AuthMethod.SSO,
      },
    });

    if (!authMethod) {
      authMethod = this.authMethodRepository.create({
        method: AuthMethod.SSO,
        isEnabled: true,
        organization,
      });
      await this.authMethodRepository.save(authMethod);
    } else if (!authMethod.isEnabled) {
      authMethod.isEnabled = true;
      await this.authMethodRepository.save(authMethod);
    }

    return ssoConfig;
  }

  async getSsoConfig(orgId: string): Promise<SsoConfigResponse | null> {
    const ssoConfig = await this.ssoConfigRepository.findOne({
      where: { organization: { id: orgId } },
    });

    if (!ssoConfig) {
      return null;
    }

    // Mask sensitive fields
    return {
      id: ssoConfig.id,
      protocol: ssoConfig.protocol,
      idpName: ssoConfig.idpName,
      jitEnabled: ssoConfig.jitEnabled,
      samlConfig: ssoConfig.samlConfig
        ? {
            idp_entity_id: ssoConfig.samlConfig.idp_entity_id,
            idp_sso_url: ssoConfig.samlConfig.idp_sso_url,
            idp_certificate: "***CONFIGURED***",
            sp_entity_id: ssoConfig.samlConfig.sp_entity_id,
            acs_url: ssoConfig.samlConfig.acs_url,
          }
        : null,
      oidcConfig: ssoConfig.oidcConfig
        ? {
            discovery_url: ssoConfig.oidcConfig.discovery_url,
            client_id: ssoConfig.oidcConfig.client_id,
            client_secret: "***CONFIGURED***",
          }
        : null,
    };
  }

  async deleteSsoConfig(orgId: string): Promise<void> {
    const ssoConfig = await this.ssoConfigRepository.findOne({
      where: { organization: { id: orgId } },
    });

    if (!ssoConfig) {
      throw new Error("SSO configuration not found");
    }

    await this.ssoConfigRepository.remove(ssoConfig);

    // Disable SSO auth method
    const authMethod = await this.authMethodRepository.findOne({
      where: {
        organization: { id: orgId },
        method: AuthMethod.SSO,
      },
    });

    if (authMethod) {
      authMethod.isEnabled = false;
      await this.authMethodRepository.save(authMethod);
    }
  }

  async testSsoConnection(orgId: string): Promise<{ success: boolean; message: string }> {
    const ssoConfig = await this.ssoConfigRepository.findOne({
      where: { organization: { id: orgId } },
    });

    if (!ssoConfig) {
      return { success: false, message: "SSO configuration not found" };
    }

    try {
      if (ssoConfig.protocol === SsoProtocol.SAML) {
        // For SAML, we can only validate the certificate format
        if (!ssoConfig.samlConfig) {
          return { success: false, message: "SAML configuration is missing" };
        }

        const cert = ssoConfig.samlConfig.idp_certificate;
        if (!cert.includes("BEGIN CERTIFICATE") || !cert.includes("END CERTIFICATE")) {
          return { success: false, message: "Invalid certificate format" };
        }

        return { success: true, message: "SAML configuration appears valid" };
      } else if (ssoConfig.protocol === SsoProtocol.OIDC) {
        if (!ssoConfig.oidcConfig) {
          return { success: false, message: "OIDC configuration is missing" };
        }

        // Try to discover the OIDC provider
        await openidClient.discovery(
          new URL(ssoConfig.oidcConfig.discovery_url),
          ssoConfig.oidcConfig.client_id,
          ssoConfig.oidcConfig.client_secret
        );

        return { success: true, message: "OIDC provider discovered successfully" };
      }

      return { success: false, message: "Unknown SSO protocol" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      return { success: false, message };
    }
  }

  getSpMetadata(orgId: string): { entityId: string; acsUrl: string } {
    return {
      entityId: `${BACKEND_URL}/api/auth/sso/saml/metadata/${orgId}`,
      acsUrl: `${BACKEND_URL}/api/auth/sso/saml/callback`,
    };
  }

  private validateSamlConfig(config: SamlConfig): void {
    if (!config.idp_entity_id) {
      throw new Error("IdP Entity ID is required");
    }
    if (!config.idp_sso_url) {
      throw new Error("IdP SSO URL is required");
    }
    if (!config.idp_certificate) {
      throw new Error("IdP Certificate is required");
    }
    if (!config.sp_entity_id) {
      throw new Error("SP Entity ID is required");
    }
    if (!config.acs_url) {
      throw new Error("ACS URL is required");
    }
  }

  private validateOidcConfig(config: OidcConfig): void {
    if (!config.discovery_url) {
      throw new Error("Discovery URL is required");
    }
    if (!config.client_id) {
      throw new Error("Client ID is required");
    }
    if (!config.client_secret) {
      throw new Error("Client Secret is required");
    }
  }
}
