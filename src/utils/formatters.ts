
import { format, parseISO, isValid } from 'date-fns';

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'RM 0.00';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return 'RM 0.00';
  
  return `RM ${numAmount.toFixed(2)}`;
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Basic formatting for Malaysian phone numbers
  // Handles different formats like 01X-XXXXXXX or 01X-XXX XXXX
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}
