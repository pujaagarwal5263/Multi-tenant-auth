import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  configureSso,
  getSsoConfig,
  deleteSsoConfig,
  testSsoConnection,
  getSpMetadata,
} from '../services/sso-admin';
import type {
  SsoConfigInput,
  SsoConfigResponse,
  SpMetadata,
} from '../services/sso-admin';

type Protocol = 'SAML' | 'OIDC';

export default function SsoConfigPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [existingConfig, setExistingConfig] = useState<SsoConfigResponse | null>(null);
  const [spMetadata, setSpMetadata] = useState<SpMetadata | null>(null);

  const [protocol, setProtocol] = useState<Protocol>('SAML');
  const [idpName, setIdpName] = useState('');
  const [jitEnabled, setJitEnabled] = useState(false);

  // SAML fields
  const [idpEntityId, setIdpEntityId] = useState('');
  const [idpSsoUrl, setIdpSsoUrl] = useState('');
  const [idpCertificate, setIdpCertificate] = useState('');
  const [spEntityId, setSpEntityId] = useState('');
  const [acsUrl, setAcsUrl] = useState('');

  // OIDC fields
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (!orgId) {
      navigate('/');
      return;
    }
    loadConfig();
  }, [orgId]);

  const loadConfig = async () => {
    if (!orgId) return;

    setLoading(true);
    setError('');

    try {
      const [configRes, metadataRes] = await Promise.all([
        getSsoConfig(orgId).catch(() => ({ success: false, data: undefined })),
        getSpMetadata(orgId),
      ]);

      if (configRes.success && configRes.data) {
        const config = configRes.data;
        setExistingConfig(config);
        setProtocol(config.protocol);
        setIdpName(config.idpName);
        setJitEnabled(config.jitEnabled);

        if (config.samlConfig) {
          setIdpEntityId(config.samlConfig.idp_entity_id || '');
          setIdpSsoUrl(config.samlConfig.idp_sso_url || '');
          setSpEntityId(config.samlConfig.sp_entity_id || '');
          setAcsUrl(config.samlConfig.acs_url || '');
        }

        if (config.oidcConfig) {
          setDiscoveryUrl(config.oidcConfig.discovery_url || '');
          setClientId(config.oidcConfig.client_id || '');
        }
      }

      if (metadataRes.success && metadataRes.data) {
        setSpMetadata(metadataRes.data);
        if (!spEntityId) setSpEntityId(metadataRes.data.entityId);
        if (!acsUrl) setAcsUrl(metadataRes.data.acsUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const config: SsoConfigInput = {
        protocol,
        idpName,
        jitEnabled,
      };

      if (protocol === 'SAML') {
        config.samlConfig = {
          idp_entity_id: idpEntityId,
          idp_sso_url: idpSsoUrl,
          idp_certificate: idpCertificate,
          sp_entity_id: spEntityId,
          acs_url: acsUrl,
        };
      } else {
        config.oidcConfig = {
          discovery_url: discoveryUrl,
          client_id: clientId,
          client_secret: clientSecret,
        };
      }

      const response = await configureSso(orgId, config);

      if (response.success) {
        setSuccess('SSO configuration saved successfully');
        loadConfig();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!orgId) return;

    setError('');
    setSuccess('');
    setTesting(true);

    try {
      const response = await testSsoConnection(orgId);

      if (response.success) {
        setSuccess(response.message || 'Connection test successful');
      } else {
        setError(response.message || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!orgId) return;

    if (!confirm('Are you sure you want to delete the SSO configuration?')) {
      return;
    }

    setError('');
    setSuccess('');
    setDeleting(true);

    try {
      const response = await deleteSsoConfig(orgId);

      if (response.success) {
        setSuccess('SSO configuration deleted');
        setExistingConfig(null);
        setIdpName('');
        setIdpEntityId('');
        setIdpSsoUrl('');
        setIdpCertificate('');
        setDiscoveryUrl('');
        setClientId('');
        setClientSecret('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete configuration');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">SSO Configuration</h1>
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 text-green-600 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protocol
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="protocol"
                    value="SAML"
                    checked={protocol === 'SAML'}
                    onChange={() => setProtocol('SAML')}
                    className="mr-2"
                  />
                  SAML 2.0
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="protocol"
                    value="OIDC"
                    checked={protocol === 'OIDC'}
                    onChange={() => setProtocol('OIDC')}
                    className="mr-2"
                  />
                  OpenID Connect
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="idpName" className="block text-sm font-medium text-gray-700 mb-1">
                Identity Provider Name
              </label>
              <input
                type="text"
                id="idpName"
                value={idpName}
                onChange={(e) => setIdpName(e.target.value)}
                placeholder="e.g., Okta, Azure AD, Auth0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="jitEnabled"
                checked={jitEnabled}
                onChange={(e) => setJitEnabled(e.target.checked)}
                className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label htmlFor="jitEnabled" className="text-sm text-gray-700">
                Enable Just-In-Time (JIT) Provisioning
                <span className="block text-xs text-gray-500">
                  Automatically create user accounts on first SSO login
                </span>
              </label>
            </div>

            {protocol === 'SAML' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-900">SAML Configuration</h3>

                {spMetadata && (
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <p className="font-medium text-gray-700 mb-2">Service Provider Metadata</p>
                    <p className="text-gray-600">
                      <strong>Entity ID:</strong> {spMetadata.entityId}
                    </p>
                    <p className="text-gray-600">
                      <strong>ACS URL:</strong> {spMetadata.acsUrl}
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="idpEntityId" className="block text-sm font-medium text-gray-700 mb-1">
                    IdP Entity ID
                  </label>
                  <input
                    type="text"
                    id="idpEntityId"
                    value={idpEntityId}
                    onChange={(e) => setIdpEntityId(e.target.value)}
                    placeholder="https://idp.example.com/entity"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="idpSsoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    IdP SSO URL
                  </label>
                  <input
                    type="url"
                    id="idpSsoUrl"
                    value={idpSsoUrl}
                    onChange={(e) => setIdpSsoUrl(e.target.value)}
                    placeholder="https://idp.example.com/sso"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="idpCertificate" className="block text-sm font-medium text-gray-700 mb-1">
                    IdP Certificate (PEM format)
                  </label>
                  <textarea
                    id="idpCertificate"
                    value={idpCertificate}
                    onChange={(e) => setIdpCertificate(e.target.value)}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
                    required={!existingConfig}
                  />
                  {existingConfig?.samlConfig?.idp_certificate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Certificate is configured. Leave blank to keep existing.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="spEntityId" className="block text-sm font-medium text-gray-700 mb-1">
                    SP Entity ID
                  </label>
                  <input
                    type="text"
                    id="spEntityId"
                    value={spEntityId}
                    onChange={(e) => setSpEntityId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="acsUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Assertion Consumer Service (ACS) URL
                  </label>
                  <input
                    type="url"
                    id="acsUrl"
                    value={acsUrl}
                    onChange={(e) => setAcsUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {protocol === 'OIDC' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-gray-900">OIDC Configuration</h3>

                <div>
                  <label htmlFor="discoveryUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Discovery URL (Issuer)
                  </label>
                  <input
                    type="url"
                    id="discoveryUrl"
                    value={discoveryUrl}
                    onChange={(e) => setDiscoveryUrl(e.target.value)}
                    placeholder="https://idp.example.com/.well-known/openid-configuration"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    id="clientId"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    id="clientSecret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required={!existingConfig}
                  />
                  {existingConfig?.oidcConfig?.client_secret && (
                    <p className="text-xs text-gray-500 mt-1">
                      Client secret is configured. Leave blank to keep existing.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>

              {existingConfig && (
                <>
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
