export enum AuthMethod {
  PASSWORD = "PASSWORD",
  OTP = "OTP",
  GOOGLE = "GOOGLE",
  SSO = "SSO",
}

export enum SsoProtocol {
  SAML = "SAML",
  OIDC = "OIDC",
}

export enum UserRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export enum OtpPurpose {
  LOGIN = "LOGIN",
  EMAIL_VERIFY = "EMAIL_VERIFY",
  PASSWORD_RESET = "PASSWORD_RESET",
}
