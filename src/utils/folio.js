export function generateFolio() {
  // Example: S2501114 (S + YYMMDD + random 2 digits)
  const d = new Date()
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 90) + 10)
  return `S${yy}${mm}${dd}${rand}`
}
