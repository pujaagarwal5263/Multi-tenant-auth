# Multi-Tenant Authentication System

A **production-ready, multi-tenant authentication backend** that allows organizations (tenants) to configure and manage their own authentication methods. Built with Node.js, TypeScript, Express, and PostgreSQL.

## 🎯 Overview

This system enables **Bring Your Own Identity Provider (BYOI)** — each organization can independently configure which authentication methods their users can use:

- **Password** — Traditional email + password login with bcrypt hashing
- **OTP** — Email-based one-time password authentication
- **Google OAuth** — Social login via Google
- **SSO** — Enterprise Single Sign-On supporting both **SAML 2.0** and **OIDC** protocols

Organizations have full control over their identity configuration. Users belong to exactly one organization and can only authenticate via the methods enabled by their org.

---

## ✨ Key Features

### Multi-Tenant Architecture
- Each organization (tenant) is isolated with its own auth configuration
- Unique 6-character org codes for easy identification
- Soft delete support for organizations and users

### BYOI — Bring Your Own IDP
Organizations can integrate their existing Identity Provider:

| Protocol | Supported IDPs |
|----------|----------------|
| **SAML 2.0** | Okta, Azure AD, OneLogin, PingIdentity, ADFS, etc. |
| **OIDC** | Okta, Auth0, Azure AD, Google Workspace, Keycloak, etc. |

### Just-In-Time (JIT) Provisioning
When enabled, users are automatically created on first SSO login — no pre-provisioning required.

### Secure Token Management
- JWT-based access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- No PII stored in tokens

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│   Login Page → Auth Methods → Password/OTP/Google/SSO Login     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express + TypeORM)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Auth Service │  │ SSO Service  │  │ SSO Admin Service    │   │
│  │ - Password   │  │ - SAML Auth  │  │ - Configure IDP      │   │
│  │ - OTP        │  │ - OIDC Auth  │  │ - Test Connection    │   │
│  │ - Google     │  │ - JIT Prov.  │  │ - Get SP Metadata    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL Database                       │
│   Organizations │ Users │ Credentials │ OrgAuthMethods │ SSO    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Identity Providers                   │
│         Okta │ Azure AD │ Google │ Auth0 │ OneLogin │ ...       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 SSO Support

### SAML 2.0

SAML (Security Assertion Markup Language) is an XML-based standard for exchanging authentication data between an Identity Provider (IdP) and a Service Provider (SP).

**Configuration required from your IdP:**

| Field | Description |
|-------|-------------|
| `idp_entity_id` | Unique identifier for your IdP |
| `idp_sso_url` | IdP's Single Sign-On URL |
| `idp_certificate` | X.509 certificate for signature verification |

**SP Metadata (provided by this system):**

| Field | Description |
|-------|-------------|
| `sp_entity_id` | `{BACKEND_URL}/api/auth/sso/saml/metadata/{orgId}` |
| `acs_url` | `{BACKEND_URL}/api/auth/sso/saml/callback` |

### OIDC (OpenID Connect)

OIDC is a modern authentication protocol built on OAuth 2.0, using JSON-based tokens.

**Configuration required from your IdP:**

| Field | Description |
|-------|-------------|
| `discovery_url` | OIDC Discovery endpoint (`.well-known/openid-configuration`) |
| `client_id` | OAuth client ID |
| `client_secret` | OAuth client secret |

**Redirect URI to configure in your IdP:**

```
{BACKEND_URL}/api/auth/sso/oidc/callback
```

---

## 📁 Project Structure

```
├── backend/
│   └── src/
│       ├── config/          # TypeORM DataSource configuration
│       ├── controllers/     # HTTP request handlers
│       ├── middleware/      # Auth verification
│       ├── migrations/      # Database migrations
│       ├── models/          # TypeORM entities
│       ├── routes/          # Express route definitions
│       ├── services/        # Business logic
│       │   ├── auth.service.ts       # Password authentication
│       │   ├── otp.service.ts        # OTP generation & verification
│       │   ├── google.service.ts     # Google OAuth flow
│       │   ├── sso.service.ts        # SAML/OIDC authentication
│       │   └── sso-admin.service.ts  # SSO configuration management
│       ├── types/           # TypeScript types & enums
│       ├── utils/           # JWT helpers, ID generators
│       ├── validators/      # Joi request validators
│       └── index.ts         # Application entry point
│
└── frontend/
    └── src/
        ├── pages/           # React pages
        │   ├── LoginPage.tsx
        │   ├── AuthMethodsPage.tsx
        │   ├── PasswordLoginPage.tsx
        │   ├── OtpLoginPage.tsx
        │   ├── SsoConfigPage.tsx
        │   └── ...
        └── services/        # API client
```

---

## 🗄️ Data Models

| Entity | Description |
|--------|-------------|
| **Organization** | Tenant with name, slug, unique 6-char org code |
| **User** | Belongs to one org; email, name, role (ADMIN/MEMBER) |
| **UserCredential** | Password hash (bcrypt) for password auth |
| **UserIdentity** | External identity links (Google, SAML, OIDC) |
| **OtpCode** | One-time passwords with expiry |
| **OrgAuthMethod** | Enabled auth methods per org |
| **OrgSsoConfig** | SAML/OIDC configuration per org |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Environment Variables

Create `.env` in the `backend/` directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=tenant_auth_db

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY_SECONDS=900
JWT_REFRESH_EXPIRY_SECONDS=604800

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Email (for OTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Installation

```bash
# Backend
cd backend
npm install
npm run migration:run
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

### Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/organizations` | Create organization with auth method |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user in organization |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/auth-modes?email=` | Get available auth methods for user |
| POST | `/api/auth/set-password` | Set user password |
| POST | `/api/auth/login-with-password` | Password login |
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP and login |
| GET | `/api/auth/google?email=` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/sso?email=` | Initiate SSO (SAML/OIDC) |
| POST | `/api/auth/sso/saml/callback` | SAML assertion callback |
| GET | `/api/auth/sso/oidc/callback` | OIDC authorization callback |

### SSO Administration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/sso/:orgId/config` | Configure SSO for organization |
| GET | `/api/admin/sso/:orgId/config` | Get SSO configuration |
| DELETE | `/api/admin/sso/:orgId/config` | Delete SSO configuration |
| POST | `/api/admin/sso/:orgId/test` | Test SSO connection |
| GET | `/api/admin/sso/:orgId/sp-metadata` | Get SP metadata for SAML setup |

---

## 🔧 SSO Configuration Examples

### Configuring SAML (e.g., Okta)

```json
POST /api/admin/sso/{orgId}/config
{
  "protocol": "SAML",
  "idpName": "Okta",
  "jitEnabled": true,
  "samlConfig": {
    "idp_entity_id": "http://www.okta.com/exk123abc",
    "idp_sso_url": "https://yourcompany.okta.com/app/yourapp/sso/saml",
    "idp_certificate": "-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----",
    "sp_entity_id": "http://localhost:8000/api/auth/sso/saml/metadata/{orgId}",
    "acs_url": "http://localhost:8000/api/auth/sso/saml/callback"
  }
}
```

### Configuring OIDC (e.g., Auth0)

```json
POST /api/admin/sso/{orgId}/config
{
  "protocol": "OIDC",
  "idpName": "Auth0",
  "jitEnabled": true,
  "oidcConfig": {
    "discovery_url": "https://yourcompany.auth0.com/.well-known/openid-configuration",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret"
  }
}
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Authentication:** JWT, bcrypt
- **SAML:** @node-saml/node-saml
- **OIDC:** openid-client
- **Validation:** Joi

### Frontend
- **Framework:** React 19
- **Routing:** React Router v7
- **Styling:** TailwindCSS v4
- **HTTP Client:** Axios
- **Build Tool:** Vite

---

## 🔒 Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with short expiry
- PKCE flow for OIDC
- Email verification before sensitive operations
- Sensitive SSO credentials masked in API responses
- State parameter validation to prevent CSRF

---

## 📝 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
