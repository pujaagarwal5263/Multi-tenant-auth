const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ORG_CODE_LENGTH = 6;

export function generateOrgCode(): string {
  let code = "";
  for (let i = 0; i < ORG_CODE_LENGTH; i++) {
    code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return code;
}
