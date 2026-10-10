/** "7:30", "7:30 min", "8 min", "8" → ISO 8601 duration; anything else → null. */
export function isoDuration(input: string | null | undefined): string | null {
  const m = (input ?? '').trim().match(/^(\d{1,3})(?::([0-5]\d))?\s*(?:min(?:utes)?)?$/i)
  if (!m) return null
  const minutes = Number(m[1])
  const seconds = m[2] ? Number(m[2]) : 0
  return `PT${minutes}M${seconds ? `${seconds}S` : ''}`
}
