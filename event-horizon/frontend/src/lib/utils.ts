import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getLevelBadgeColor(level: string) {
  switch (level.toUpperCase()) {
    case "ERROR":
      return "bg-red-500 hover:bg-red-600"
    case "WARNING":
      return "bg-yellow-500 hover:bg-yellow-600"
    case "INFORMATION":
      return "bg-blue-500 hover:bg-blue-600"
    case "DEBUG":
      return "bg-green-500 hover:bg-green-600"
    case "TRACE":
      return "bg-purple-500 hover:bg-purple-600"
    default:
      return "bg-gray-500 hover:bg-gray-600"
  }
}

export function getLevelBgColor(level: string) {
  switch (level.toUpperCase()) {
    case "ERROR":
      return "bg-red-50 dark:bg-red-950"
    case "WARN":
      return "bg-yellow-50 dark:bg-yellow-950"
    case "INFO":
      return "bg-blue-50 dark:bg-blue-950"
    case "DEBUG":
      return "bg-green-50 dark:bg-green-950"
    case "TRACE":
      return "bg-purple-50 dark:bg-purple-950"
    default:
      return "bg-gray-50 dark:bg-gray-900"
  }
}