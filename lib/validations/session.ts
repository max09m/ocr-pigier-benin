import { z } from "zod"

export const SOURCE_OPTIONS = ["tablette", "ocr"] as const

export const SOURCE_LABELS: Record<(typeof SOURCE_OPTIONS)[number], string> = {
  tablette: "Tablette",
  ocr: "OCR (scan papier)",
}

export const sessionSchema = z.object({
  etablissement: z.string().trim().min(1, "L'établissement est requis"),
  dateTractage: z.string().trim().min(1, "La date est requise"),
  templateId: z.string().trim().min(1, "Le template est requis"),
  source: z.enum(SOURCE_OPTIONS),
})

export type SessionFormValues = z.infer<typeof sessionSchema>
