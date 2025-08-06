/**
 * Phone number validation and formatting utilities
 */

export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  
  if (!match) return value;
  
  const [, area, exchange, number] = match;
  
  if (number) {
    return `(${area}) ${exchange}-${number}`;
  } else if (exchange) {
    return `(${area}) ${exchange}`;
  } else if (area) {
    return `(${area}`;
  } else {
    return area;
  }
}

export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits (US phone number)
  return cleaned.length === 10;
}

export function getCleanPhoneNumber(phone: string): string {
  // Return just the digits for database storage
  return phone.replace(/\D/g, '');
}

export function isValidPhoneFormat(phone: string): boolean {
  // Check if phone matches the format: (XXX) XXX-XXXX
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  return phoneRegex.test(phone);
}