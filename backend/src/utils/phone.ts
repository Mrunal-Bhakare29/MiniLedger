const INDIAN_MOBILE = /^[6-9]\d{9}$/;

export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function isValidIndianMobile(phone: string): boolean {
  return INDIAN_MOBILE.test(phone);
}

export function toE164In(phone: string): string {
  return `+91${phone}`;
}
