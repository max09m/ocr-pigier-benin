"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import {
  templateSchema,
  createFieldSchema,
  updateFieldSchema,
} from "@/lib/validations/template"

type ActionResult = { error?: string }

function normalizeOptions(options: string[]) {
  return options.length > 0 ? options : undefined
}

export async function createTemplate(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin()
  const parsed = templateSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const template = await prisma.template.create({
    data: {
      nom: parsed.data.nom,
      annee: parsed.data.annee,
      createdBy: session.user.id,
    },
  })

  revalidatePath("/admin/templates")
  redirect(`/admin/templates/${template.id}`)
}

export async function toggleTemplateActif(templateId: string, actif: boolean) {
  await requireAdmin()

  await prisma.template.update({
    where: { id: templateId },
    data: { actif },
  })

  revalidatePath("/admin/templates")
  revalidatePath(`/admin/templates/${templateId}`)
}

export async function createField(
  templateId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = createFieldSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const existing = await prisma.field.findUnique({
    where: { templateId_key: { templateId, key: parsed.data.key } },
  })

  if (existing) {
    return {
      error: `La clé "${parsed.data.key}" est déjà utilisée sur ce template`,
    }
  }

  await prisma.field.create({
    data: {
      templateId,
      key: parsed.data.key,
      label: parsed.data.label,
      type: parsed.data.type,
      requis: parsed.data.requis,
      options: normalizeOptions(parsed.data.options),
      ordre: parsed.data.ordre,
    },
  })

  revalidatePath(`/admin/templates/${templateId}`)
  return {}
}

export async function updateField(
  fieldId: string,
  templateId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = updateFieldSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  await prisma.field.update({
    where: { id: fieldId },
    data: {
      label: parsed.data.label,
      type: parsed.data.type,
      requis: parsed.data.requis,
      options: normalizeOptions(parsed.data.options),
      ordre: parsed.data.ordre,
    },
  })

  revalidatePath(`/admin/templates/${templateId}`)
  return {}
}

export async function toggleFieldActif(
  fieldId: string,
  templateId: string,
  actif: boolean
) {
  await requireAdmin()

  await prisma.field.update({
    where: { id: fieldId },
    data: { actif },
  })

  revalidatePath(`/admin/templates/${templateId}`)
}
