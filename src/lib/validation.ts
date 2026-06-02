// Lightweight input validation helpers (no extra deps)

export function sanitizeText(input: string, max = 100): string {
  return input.replace(/[<>]/g, "").trim().slice(0, max);
}

export function isValidPhone(phone: string): boolean {
  // Cameroon-style: 8-15 digits, allow spaces/+/-
  const digits = phone.replace(/[\s+\-().]/g, "");
  return /^\d{8,15}$/.test(digits);
}

export function isValidName(name: string): boolean {
  const t = name.trim();
  return t.length >= 2 && t.length <= 60 && /^[\p{L}\p{M}\s'.-]+$/u.test(t);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function isValidUnlockCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
