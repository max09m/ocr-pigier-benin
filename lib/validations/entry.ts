import type { Field } from "@/app/generated/prisma/client"

export const PHONE_REGEX = /^01[0-9]{8}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/
const DATE_DMY_REGEX = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/

export type EntryValues = Record<string, string>

export type EntryValidationResult =
  | { success: true; data: Record<string, string | number> }
  | { success: false; errors: Record<string, string> }

export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "")

  // Numéro saisi avec l'indicatif international (+229 / 229)
  if (digits.startsWith("229") && digits.length > 10) {
    digits = digits.slice(3)
  }

  if (!digits.startsWith("01")) {
    // Ancien format à 8 chiffres (sans le préfixe "01" introduit en 2021)
    if (digits.length === 8) {
      digits = `01${digits}`
    }
    // Préfixe "01" saisi/lu sans le "0" initial (ex: OCR)
    else if (digits.length === 9 && digits.startsWith("1")) {
      digits = `0${digits}`
    }
  }

  return digits
}

function isValidYmd(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

// Convertit une date saisie/lue (ISO ou JJ/MM/AAAA, JJ/MM/AA...) au format
// canonique ISO (AAAA-MM-JJ), pour garder un seul format en base quelle que
// soit la source (OCR, saisie tablette). Retourne "" si non reconnaissable.
export function normalizeDate(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return ""

  const isoMatch = trimmed.match(DATE_ISO_REGEX)
  if (isoMatch) {
    const [, y, m, d] = isoMatch
    return isValidYmd(Number(y), Number(m), Number(d)) ? trimmed : ""
  }

  const dmyMatch = trimmed.match(DATE_DMY_REGEX)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const day = Number(d)
    const month = Number(m)
    const year = y.length === 2 ? 2000 + Number(y) : Number(y)
    if (!isValidYmd(year, month, day)) return ""
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  return ""
}

export function validateEntry(
  fields: Field[],
  values: EntryValues
): EntryValidationResult {
  const errors: Record<string, string> = {}
  const data: Record<string, string | number> = {}

  for (const field of fields.filter((f) => f.actif)) {
    const raw = (values[field.key] ?? "").trim()

    if (!raw) {
      if (field.requis) {
        errors[field.key] = `${field.label} est requis`
      }
      continue
    }

    switch (field.type) {
      case "tel": {
        const normalized = normalizePhone(raw)
        if (!PHONE_REGEX.test(normalized)) {
          errors[field.key] = "Format attendu : 01XXXXXXXX"
        } else {
          data[field.key] = normalized
        }
        break
      }
      case "email": {
        if (!EMAIL_REGEX.test(raw)) {
          errors[field.key] = "Email invalide"
        } else {
          data[field.key] = raw
        }
        break
      }
      case "number": {
        const num = Number(raw)
        if (Number.isNaN(num)) {
          errors[field.key] = "Nombre invalide"
        } else {
          data[field.key] = num
        }
        break
      }
      case "date": {
        const normalized = normalizeDate(raw)
        if (!normalized) {
          errors[field.key] = "Date invalide"
        } else {
          data[field.key] = normalized
        }
        break
      }
      case "select": {
        const options = Array.isArray(field.options)
          ? (field.options as string[])
          : []
        if (!options.includes(raw)) {
          errors[field.key] = "Valeur invalide"
        } else {
          data[field.key] = raw
        }
        break
      }
      default: {
        data[field.key] = raw
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors }
  }

  return { success: true, data }
}

export function entryHasIssues(
  fields: Field[],
  valeurs: Record<string, unknown>
) {
  const stringValues = Object.fromEntries(
    fields.map((field) => [field.key, String(valeurs[field.key] ?? "")])
  )
  return !validateEntry(fields, stringValues).success
}
