import "server-only"
import { Mistral } from "@mistralai/mistralai"
import type { Field } from "@/app/generated/prisma/client"

export const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

export const OCR_MODEL = "mistral-ocr-latest"

export function buildOcrSchema(fields: Field[]) {
  const properties: Record<string, unknown> = {}
  for (const field of fields.filter((f) => f.actif)) {
    properties[field.key] = {
      type: field.type === "number" ? "number" : "string",
      description:
        field.type === "date"
          ? `${field.label} (format JJ/MM/AAAA)`
          : field.label,
    }
  }

  return {
    type: "object",
    properties: {
      lignes: {
        type: "array",
        items: { type: "object", properties },
      },
    },
  }
}
