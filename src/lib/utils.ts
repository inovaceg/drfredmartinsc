import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper functions for date formatting (dd/mm/yyyy)
export const formatDateToDisplay = (dateString: string | null): string => {
  if (!dateString) return "";
  try {
    // Use parseYYYYMMDDToLocalDate to ensure the Date object is created in local timezone
    const date = parseYYYYMMDDToLocalDate(dateString); 
    
    if (!date || isNaN(date.getTime())) return "";
    return format(date, "dd/MM/yyyy"); // Format for display
  } catch {
    return "";
  }
};

export const parseDateFromInput = (inputString: string): string | null => {
  if (!inputString) return null;
  // Expecting dd/mm/yyyy
  const parts = inputString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    
    // Basic validation for day, month, year ranges
    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 0 || month > 11 || year < 1900 || year > 2100) {
      return null; // Invalid date components
    }

    const date = new Date(year, month, day); // This creates a Date object in local timezone
    // Check for valid date and prevent invalid dates like Feb 30th
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return format(date, "yyyy-MM-dd"); // Return YYYY-MM-DD for internal state and DB
    }
  }
  return null; // Invalid format or invalid date
};

// Nova função utilitária para criar um objeto Date local a partir de uma string YYYY-MM-DD
export const createLocalDateFromISOString = (isoDateString: string): Date => {
  // Using 'T00:00:00' to ensure it's parsed as a local date at midnight
  return new Date(isoDateString + 'T00:00:00');
};

// Nova função para parsear strings YYYY-MM-DD para objetos Date locais
export const parseYYYYMMDDToLocalDate = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    // Month is 0-indexed in JavaScript Date constructor
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    // Validate if the date components match (e.g., prevent Feb 30th)
    if (date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2]) {
      return date;
    }
  }
  return null;
};