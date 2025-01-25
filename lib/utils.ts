import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function convertToAscii(text: string): string {
  // Example logic for converting text to ASCII
  return text.split('').map(char => char.charCodeAt(0).toString()).join(' ');
}