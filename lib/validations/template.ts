import { z } from "zod"

export const templateSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis"),
  annee: z.coerce.number().int().min(2000).max(2100),
})

export type TemplateFormValues = z.infer<typeof templateSchema>

export const FIELD_TYPES = [
  "text",
  "tel",
  "email",
  "number",
  "date",
  "select",
] as const

export const FIELD_TYPE_LABELS: Record<(typeof FIELD_TYPES)[number], string> = {
  text: "Texte",
  tel: "Téléphone",
  email: "Email",
  number: "Nombre",
  date: "Date",
  select: "Liste déroulante",
}

const fieldBaseSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "La clé est requise")
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Minuscules, chiffres et underscores uniquement, doit commencer par une lettre"
    ),
  label: z.string().trim().min(1, "Le libellé est requis"),
  type: z.enum(FIELD_TYPES),
  requis: z.boolean(),
  options: z.array(z.string().trim().min(1)),
  ordre: z.coerce.number().int().min(0),
})

const selectOptionsRefinement: [
  (data: { type: string; options: string[] }) => boolean,
  { message: string; path: [string] },
] = [
  (data) => data.type !== "select" || data.options.length > 0,
  {
    message: "Ajoutez au moins une option",
    path: ["options"],
  },
]

export const createFieldSchema = fieldBaseSchema.refine(...selectOptionsRefinement)
export type CreateFieldValues = z.infer<typeof createFieldSchema>

export const updateFieldSchema = fieldBaseSchema
  .omit({ key: true })
  .refine(...selectOptionsRefinement)
export type UpdateFieldValues = z.infer<typeof updateFieldSchema>
