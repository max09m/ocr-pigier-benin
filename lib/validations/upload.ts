import { z } from "zod"

export const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1, "Le nom de fichier est requis"),
  contentType: z.string().trim().min(1, "Le type de fichier est requis"),
  size: z
    .number()
    .min(1, "Le fichier est vide")
    .max(20 * 1024 * 1024, "Le fichier dépasse 20 Mo"),
})

export type UploadRequestValues = z.infer<typeof uploadRequestSchema>
