import { z } from "zod"

export const USER_ROLES = ["admin", "agent"] as const

export const USER_ROLE_LABELS: Record<(typeof USER_ROLES)[number], string> = {
  admin: "Admin",
  agent: "Agent",
}

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  email: z.string().trim().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  role: z.enum(USER_ROLES),
})

export type CreateUserValues = z.infer<typeof createUserSchema>
