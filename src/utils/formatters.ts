
import { format, isValid, parseISO } from "date-fns";

/**
 * Formats a date string to a human-readable format
 * @param dateString The date string to format
 * @param formatString Optional format string (defaults to dd/MM/yyyy)
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (dateString?: string, formatString: string = "dd/MM/yyyy"): string => {
  if (!dateString) return "";
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "";
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Formats a number as currency
 * @param amount The amount to format
 * @param currency The currency code (defaults to RM)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount?: number | string, currency: string = "RM"): string => {
  if (amount === undefined || amount === null) return `${currency} 0.00`;
  
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return `${currency} 0.00`;
  
  return `${currency} ${numAmount.toFixed(2)}`;
};

/**
 * Format a phone number to add proper spacing
 * @param phone The phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return "";
  
  // Remove any non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format Malaysian phone number (simple formatting)
  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  } else if (digitsOnly.length === 11) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // Return as is if it doesn't match expected formats
  return phone;
};

// Export alias for backward compatibility
export const formatPhone = formatPhoneNumber;
