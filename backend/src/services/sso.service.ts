import { SAML } from "@node-saml/node-saml";
import * as openidClient from "openid-client";
import { AppDataSource } from "../config/data-source";
import { User } from "../models/user";
import { UserIdentity } from "../models/user-identity";
import { OrgSsoConfig } from "../models/org-sso-config";
import { OrgAuthMethod } from "../models/org-auth-method";
import { Organization } from "../models/organization";
import { AuthMethod, SsoProtocol, UserRole } from "../types";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

interface SsoUserInfo {
  email: string;
  name?: string;
  externalId: string;
}

export class SsoService {
  private userRepository = AppDataSource.getRepository(User);
  private identityRepository = AppDataSource.getRepository(UserIdentity);
  private ssoConfigRepository = AppDataSource.getRepository(OrgSsoConfig);
  private authMethodRepository = AppDataSource.getRepository(OrgAuthMethod);
  private orgRepository = AppDataSource.getRepository(Organization);

  async getSsoConfigForUser(email: string): Promise<{
    ssoConfig: OrgSsoConfig;
    user: User | null;
  }> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ["organization"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const authMethod = await this.authMethodRepository.findOne({
      where: {
        organization: { id: user.organization.id },
        method: AuthMethod.SSO,
        isEnabled: true,
      },
    });

    if (!authMethod) {
      throw new Error("SSO authentication is not enabled for your organization");
    }

    const ssoConfig = await this.ssoConfigRepository.findOne({
      where: { organization: { id: user.organization.id } },
      relations: ["organization"],
    });

    if (!ssoConfig) {
      throw new Error("SSO is not configured for your organization");
    }

    return { ssoConfig, user };
  }

  async getSamlAuthUrl(email: string): Promise<string> {
    const { ssoConfig } = await this.getSsoConfigForUser(email);

    if (ssoConfig.protocol !== SsoProtocol.SAML || !ssoConfig.samlConfig) {
      throw new Error("SAML is not configured for this organization");
    }

    const saml = new SAML({
      issuer: ssoConfig.samlConfig.sp_entity_id,
      callbackUrl: `${BACKEND_URL}/api/auth/sso/saml/callback`,
      entryPoint: ssoConfig.samlConfig.idp_sso_url,
      idpCert: ssoConfig.samlConfig.idp_certificate,
      wantAssertionsSigned: true,
      signatureAlgorithm: "sha256",
    });

    const state = Buffer.from(JSON.stringify({ email })).toString("base64");

    const url = await saml.getAuthorizeUrlAsync(state, "", {});
    return url;
  }

  async handleSamlCallback(
    samlResponse: string,
    relayState?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // First, try to extract email from RelayState or SAML response
    let expectedEmail: string;

    if (relayState) {
      const parsed = JSON.parse(Buffer.from(relayState, "base64").toString("utf-8"));
      expectedEmail = parsed.email;
    } else {
      // Extract email from SAML assertion
      const decodedResponse = Buffer.from(samlResponse, "base64").toString("utf-8");
      const emailMatch = decodedResponse.match(/emailaddress[^>]*>([^<]+)</i)
        || decodedResponse.match(/NameID[^>]*Format="[^"]*emailAddress[^>]*>([^<]+)</i)
        || decodedResponse.match(/NameID[^>]*>([^<]+)</i);

      if (!emailMatch) {
        throw new Error("Could not determine user email from SAML response");
      }
      expectedEmail = emailMatch[1];
    }

    const { ssoConfig } = await this.getSsoConfigForUser(expectedEmail);

    if (ssoConfig.protocol !== SsoProtocol.SAML || !ssoConfig.samlConfig) {
      throw new Error("SAML is not configured for this organization");
    }

    // Clean up certificate - ensure proper PEM format
    let cert = ssoConfig.samlConfig.idp_certificate.trim();
    if (!cert.includes("-----BEGIN CERTIFICATE-----")) {
      cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;
    }

    const saml = new SAML({
      issuer: ssoConfig.samlConfig.sp_entity_id,
      callbackUrl: `${BACKEND_URL}/api/auth/sso/saml/callback`,
      entryPoint: ssoConfig.samlConfig.idp_sso_url,
      idpCert: cert,
      wantAssertionsSigned: false,
      wantAuthnResponseSigned: false,
      signatureAlgorithm: "sha256",
    });

    const { profile } = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse });

    if (!profile) {
      throw new Error("Invalid SAML response");
    }

    const userInfo: SsoUserInfo = {
      email: (profile.email || profile.nameID) as string,
      name: (profile.displayName || profile.name || profile.firstName) as string | undefined,
      externalId: profile.nameID as string,
    };

    if (userInfo.email.toLowerCase() !== expectedEmail.toLowerCase()) {
      throw new Error(`Email mismatch: expected ${expectedEmail}, got ${userInfo.email}`);
    }

    return this.authenticateUser(userInfo, ssoConfig, "SAML");
  }

  async getOidcAuthUrl(email: string): Promise<string> {
    const { ssoConfig } = await this.getSsoConfigForUser(email);

    if (ssoConfig.protocol !== SsoProtocol.OIDC || !ssoConfig.oidcConfig) {
      throw new Error("OIDC is not configured for this organization");
    }

    const config = await openidClient.discovery(
      new URL(ssoConfig.oidcConfig.discovery_url),
      ssoConfig.oidcConfig.client_id,
      ssoConfig.oidcConfig.client_secret
    );

    const state = Buffer.from(JSON.stringify({ email })).toString("base64");
    const codeVerifier = openidClient.randomPKCECodeVerifier();
    const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);

    // Store code verifier in state for later use (simplified - in production use session/cache)
    const stateWithVerifier = Buffer.from(
      JSON.stringify({ email, codeVerifier })
    ).toString("base64");

    const redirectUri = `${BACKEND_URL}/api/auth/sso/oidc/callback`;

    const authUrl = openidClient.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: "openid email profile",
      state: stateWithVerifier,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return authUrl.href;
  }

  async handleOidcCallback(
    code: string,
    state: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email: expectedEmail, codeVerifier } = JSON.parse(
      Buffer.from(state, "base64").toString("utf-8")
    );

    const { ssoConfig } = await this.getSsoConfigForUser(expectedEmail);

    if (ssoConfig.protocol !== SsoProtocol.OIDC || !ssoConfig.oidcConfig) {
      throw new Error("OIDC is not configured for this organization");
    }

    const config = await openidClient.discovery(
      new URL(ssoConfig.oidcConfig.discovery_url),
      ssoConfig.oidcConfig.client_id,
      ssoConfig.oidcConfig.client_secret
    );

    const redirectUri = `${BACKEND_URL}/api/auth/sso/oidc/callback`;
    const currentUrl = new URL(`${redirectUri}?code=${code}&state=${state}`);

    const tokens = await openidClient.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
    });

    const claims = tokens.claims();
    if (!claims) {
      throw new Error("No claims in ID token");
    }

    const userInfo: SsoUserInfo = {
      email: claims.email as string,
      name: claims.name as string | undefined,
      externalId: claims.sub,
    };

    if (!userInfo.email) {
      throw new Error("Email not provided by OIDC provider");
    }

    if (userInfo.email.toLowerCase() !== expectedEmail.toLowerCase()) {
      throw new Error(`Email mismatch: expected ${expectedEmail}, got ${userInfo.email}`);
    }

    return this.authenticateUser(userInfo, ssoConfig, "OIDC");
  }

  private async authenticateUser(
    userInfo: SsoUserInfo,
    ssoConfig: OrgSsoConfig,
    provider: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let user = await this.userRepository.findOne({
      where: { email: userInfo.email },
      relations: ["organization"],
    });

    if (!user) {
      if (!ssoConfig.jitEnabled) {
        throw new Error("User not found. Please contact your administrator.");
      }

      // JIT provisioning - create user
      user = this.userRepository.create({
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split("@")[0],
        role: UserRole.MEMBER,
        isVerified: true,
        organization: ssoConfig.organization,
      });
      await this.userRepository.save(user);
    }

    // Link or verify SSO identity
    let identity = await this.identityRepository.findOne({
      where: {
        userId: user.id,
        provider,
      },
    });

    if (!identity) {
      identity = this.identityRepository.create({
        userId: user.id,
        provider,
        externalId: userInfo.externalId,
      });
      await this.identityRepository.save(identity);
    } else if (identity.externalId !== userInfo.externalId) {
      throw new Error(`This account is linked to a different ${provider} account`);
    }

    // Mark user as verified
    if (!user.isVerified) {
      user.isVerified = true;
      await this.userRepository.save(user);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  async getAuthUrl(email: string): Promise<string> {
    const { ssoConfig } = await this.getSsoConfigForUser(email);

    if (ssoConfig.protocol === SsoProtocol.SAML) {
      return this.getSamlAuthUrl(email);
    } else if (ssoConfig.protocol === SsoProtocol.OIDC) {
      return this.getOidcAuthUrl(email);
    }

    throw new Error("Unknown SSO protocol");
  }
}
