import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function parseDuration(durationStr: string): number | null {
  if (!durationStr || !durationStr.trim()) return null
  
  // Clean string
  const cleanStr = durationStr.trim()
  
  // If it's just a number, assume seconds if < 60, or minutes if it looks like a year? 
  // Better to assume seconds if it's a plain number for safety in this context, 
  // or maybe the user types "8" meaning 8 minutes? 
  // Standard convention: "mm:ss". If no colon, treat as minutes? Or seconds?
  // Let's stick to "mm:ss" parsing. If no colon, try to parse as number (seconds) for backward compatibility or assume minutes if small?
  // Let's enforce colon or assume seconds if plain number.
  
  if (!cleanStr.includes(':')) {
    const num = parseInt(cleanStr, 10)
    return isNaN(num) ? null : num
  }
  
  const parts = cleanStr.split(':')
  const minutes = parseInt(parts[0], 10)
  const seconds = parseInt(parts[1], 10)
  
  if (isNaN(minutes) || isNaN(seconds)) return null
  
  return (minutes * 60) + seconds
}
