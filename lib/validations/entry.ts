import type { Field } from "@/app/generated/prisma/client"

const PHONE_REGEX = /^01[0-9]{8}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
        if (Number.isNaN(Date.parse(raw))) {
          errors[field.key] = "Date invalide"
        } else {
          data[field.key] = raw
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
