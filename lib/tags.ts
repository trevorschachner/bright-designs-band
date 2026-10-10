/** Tag name as shown on chips: the stored "Theme: " prefix is for filtering, not display. */
export function displayTagName(name: string): string {
  return name.replace(/^Theme: /, '')
}
