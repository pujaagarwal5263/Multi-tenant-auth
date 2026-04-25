import api from './api';

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
  protocol: 'SAML' | 'OIDC';
  idpName: string;
  jitEnabled: boolean;
  samlConfig?: SamlConfig;
  oidcConfig?: OidcConfig;
}

export interface SsoConfigResponse {
  id: string;
  protocol: 'SAML' | 'OIDC';
  idpName: string;
  jitEnabled: boolean;
  samlConfig: Partial<SamlConfig> | null;
  oidcConfig: Partial<OidcConfig> | null;
}

export interface SpMetadata {
  entityId: string;
  acsUrl: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export const configureSso = async (
  orgId: string,
  config: SsoConfigInput
): Promise<ApiResponse<{ id: string; protocol: string; idpName: string; jitEnabled: boolean }>> => {
  const response = await api.post(`/admin/sso/${orgId}/config`, config);
  return response.data;
};

export const getSsoConfig = async (
  orgId: string
): Promise<ApiResponse<SsoConfigResponse>> => {
  const response = await api.get(`/admin/sso/${orgId}/config`);
  return response.data;
};

export const deleteSsoConfig = async (
  orgId: string
): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/admin/sso/${orgId}/config`);
  return response.data;
};

export const testSsoConnection = async (
  orgId: string
): Promise<ApiResponse<null>> => {
  const response = await api.post(`/admin/sso/${orgId}/test`);
  return response.data;
};

export const getSpMetadata = async (
  orgId: string
): Promise<ApiResponse<SpMetadata>> => {
  const response = await api.get(`/admin/sso/${orgId}/sp-metadata`);
  return response.data;
};
