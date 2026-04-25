# Multi-Tenant Login System

## Project Overview

This is a **multi-tenant login system** where each account (organization/tenant) can enable one or more login methods from a defined set. The backend handles authentication on behalf of multiple organizations, each with their own auth configuration.

**Core concept:**
- An **Organization** (tenant) is the root entity. When created, it chooses which auth methods to enable: `PASSWORD`, `OTP`, `GOOGLE`, or `SSO`.
- Users in that org can only authenticate via the org's enabled methods.
- **SSO**: Orgs enabling SSO must configure their Identity Provider (IDP) — IDP entity ID, SSO URL, X.509 certificate, ACS URL, SP entity ID (SAML), or discovery URL + client ID/secret (OIDC).
- **Google / OAuth**: Orgs enabling Google auth configure OAuth client credentials.
- Users belong to exactly one organization. Email uniqueness is **per-org**, not global.

**Stack:** Node.js · TypeScript · Express · TypeORM · PostgreSQL · JWT · Bcrypt · Joi

---

## Folder Structure

```
backend/src/
├── config/        TypeORM DataSource (PostgreSQL)
├── controllers/   HTTP handlers — static methods, delegate to services
├── filters/       Global error handlers (TODO — stub)
├── middleware/    Auth token verification + org detection (TODO — stub)
├── migrations/    TypeORM migration files (3 applied so far)
├── models/        TypeORM entities
├── repositories/  Custom repo classes (TODO — stub; services use AppDataSource directly)
├── routes/        Express router definitions
├── services/      Business logic
├── types/         Enums (AuthMethod, SsoProtocol, UserRole, OtpPurpose), config interfaces
├── utils/         JWT helpers, org code generator (6-char alphanumeric)
├── validators/    Joi middleware validators
└── index.ts       Entry point: initializes DB, Express, listens on PORT (default 8000)
```

---

## Data Models

All entities extend `BaseEntity` (id: UUID auto-gen, createdAt, updatedAt).

| Entity | Key Fields |
|--------|-----------|
| **Organization** | name, slug (unique), orgCode (6-char unique), deletedAt (soft delete) |
| **User** | email, name, role (ADMIN\|MEMBER), isVerified, orgId (FK), deletedAt (soft delete) |
| **UserCredential** | userId (1-to-1), passwordHash (bcrypt, 10 rounds) |
| **UserIdentity** | userId, provider (e.g. "GOOGLE"), externalId — for OAuth/SSO logins |
| **OtpCode** | userId, code (6-char), purpose (LOGIN\|EMAIL_VERIFY\|PASSWORD_RESET), expiresAt, usedAt |
| **OrgAuthMethod** | orgId, method (PASSWORD\|OTP\|GOOGLE\|SSO), isEnabled — one row per method per org |
| **OrgSsoConfig** | orgId (1-to-1), protocol (SAML\|OIDC), idpName, samlConfig (JSONB), oidcConfig (JSONB) |

**SAML config fields:** `idp_entity_id`, `idp_sso_url`, `idp_certificate`, `sp_entity_id`, `acs_url`  
**OIDC config fields:** `discovery_url`, `client_id`, `client_secret`

---

## API Routes (all under `/api`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/organizations` | Create org + initial auth method |
| POST | `/users` | Create user in org (`orgId` field = orgCode, not UUID) |
| POST | `/auth/set-password` | Set/update password for a user |
| POST | `/auth/login-with-password` | Returns `{ accessToken, refreshToken }` |

---

## Auth Flows

| Method | Status |
|--------|--------|
| Password (bcrypt + JWT) | Implemented |
| OTP | Models exist, service/routes TODO |
| Google OAuth | Models exist (UserIdentity), service/routes TODO |
| SSO — SAML | Config table exists (OrgSsoConfig), service/routes TODO |
| SSO — OIDC | Config table exists (OrgSsoConfig), service/routes TODO |

---

## Tokens

- **Access token**: 15 min — secret: `JWT_ACCESS_SECRET`
- **Refresh token**: 7 days — secret: `JWT_REFRESH_SECRET`
- **Payload**: `{ sub: userId }` — no PII stored in token

---

## Key Conventions

- Services `throw new Error(message)`; controllers catch and return `{ success: false, message }`
- Validators return `{ success: false, message, errors: [] }` with HTTP 400 on failure
- `orgId` passed in user creation = orgCode (6-char string), not UUID
- DB columns: `snake_case` · TypeScript properties: `camelCase`
- Soft deletes via `@DeleteDateColumn()` on Organization and User only

---

## Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=tenant_auth_db

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY_SECONDS=900
JWT_REFRESH_EXPIRY_SECONDS=604800
```

---

## Known TODOs / Incomplete Areas

- `middleware/index.ts` — auth token verification + org detection (stubs only)
- `filters/index.ts` — global error handler (stub)
- `repositories/index.ts` — custom repository layer (stub; services use `AppDataSource` directly)
- OTP flow: code generation, sending, verification
- Google OAuth flow: redirect, callback, token exchange
- SSO flow: SAML assertion handling, OIDC token exchange
- No rate limiting anywhere
- CORS allows all origins (`cors()` with no config)
- No env variable validation on startup

---

## Dev Commands

```bash
cd backend
npm run dev                   # ts-node-dev watch mode
npm run build                 # TypeScript compile
npm run migration:generate    # Generate new migration from entity changes
npm run migration:run         # Apply pending migrations
npm run migration:revert      # Roll back last migration
```

---

## Critical Files

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | App entry point |
| `backend/src/config/data-source.ts` | TypeORM + DB config |
| `backend/src/types/enums.ts` | All enums (AuthMethod, SsoProtocol, UserRole, OtpPurpose) |
| `backend/src/types/config.ts` | SamlConfig, OidcConfig interfaces |
| `backend/src/utils/jwt.ts` | Token generation/verification |
| `backend/src/utils/id-generator.ts` | 6-char org code generator |
| `backend/src/services/auth.service.ts` | Password set + login logic |
| `backend/src/services/org.service.ts` | Org creation, lookup by orgCode |
| `backend/src/services/user.service.ts` | User creation, findByEmail |
