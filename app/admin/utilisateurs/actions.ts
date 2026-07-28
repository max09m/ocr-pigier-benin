"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/session"
import { createUserSchema, USER_ROLES } from "@/lib/validations/user"

type ActionResult = { error?: string }

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function createUserAccount(input: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  try {
    await auth.api.createUser({
      headers: await headers(),
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
        // Better Auth's admin plugin types only know the built-in "user"/"admin"
        // roles; "agent" is our own custom role and is a valid string at runtime.
        role: parsed.data.role as "admin" | "user",
      },
    })
  } catch (error) {
    return { error: errorMessage(error, "Échec de la création du compte") }
  }

  revalidatePath("/admin/utilisateurs")
  return {}
}

export async function changeUserRole(
  userId: string,
  role: (typeof USER_ROLES)[number]
): Promise<ActionResult> {
  await requireAdmin()

  try {
    await auth.api.setRole({
      headers: await headers(),
      body: { userId, role: role as "admin" | "user" },
    })
  } catch (error) {
    return { error: errorMessage(error, "Échec du changement de rôle") }
  }

  revalidatePath("/admin/utilisateurs")
  return {}
}

export async function toggleUserBan(
  userId: string,
  banned: boolean
): Promise<ActionResult> {
  await requireAdmin()

  try {
    if (banned) {
      await auth.api.banUser({ headers: await headers(), body: { userId } })
    } else {
      await auth.api.unbanUser({ headers: await headers(), body: { userId } })
    }
  } catch (error) {
    return { error: errorMessage(error, "Échec de l'opération") }
  }

  revalidatePath("/admin/utilisateurs")
  return {}
}
