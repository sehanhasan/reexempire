
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "";
    return format(date, "dd/MM/yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};
