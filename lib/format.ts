import type { Field } from "@/app/generated/prisma/client"

export function formatPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim()
}

export function formatFieldValue(field: Field, value: unknown) {
  if (value == null || value === "") return "—"
  if (field.type === "tel") return formatPhoneDisplay(String(value))
  return String(value)
}
