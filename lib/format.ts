import type { Field } from "@/app/generated/prisma/client"

export function formatPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim()
}

// Les dates sont stockées en ISO (AAAA-MM-JJ) ; on les affiche en JJ/MM/AAAA
// pour un format unique et lisible, quelle que soit la source (OCR/tablette).
export function formatDateDisplay(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

export function formatFieldValue(field: Field, value: unknown) {
  if (value == null || value === "") return "—"
  if (field.type === "tel") return formatPhoneDisplay(String(value))
  if (field.type === "date") return formatDateDisplay(String(value))
  return String(value)
}
