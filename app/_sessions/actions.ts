"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { sessionSchema } from "@/lib/validations/session"
import { validateEntry, type EntryValues } from "@/lib/validations/entry"

type ActionResult = { error?: string }

export async function createSession(
  basePath: string,
  input: unknown
): Promise<ActionResult> {
  const session = await requireAuth()
  const parsed = sessionSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const tractageSession = await prisma.tractageSession.create({
    data: {
      templateId: parsed.data.templateId,
      etablissement: parsed.data.etablissement,
      dateTractage: new Date(parsed.data.dateTractage),
      source: parsed.data.source,
      createdBy: session.user.id,
    },
  })

  revalidatePath("/admin/sessions")
  revalidatePath("/agents/sessions")
  redirect(`${basePath}/${tractageSession.id}`)
}

type CreateEntryResult = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createEntry(
  sessionId: string,
  input: EntryValues
): Promise<CreateEntryResult> {
  await requireAuth()

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    include: { template: { include: { fields: true } } },
  })

  if (!tractageSession) {
    return { error: "Session introuvable" }
  }

  const result = validateEntry(tractageSession.template.fields, input)

  if (!result.success) {
    return { fieldErrors: result.errors }
  }

  const lastEntry = await prisma.entry.aggregate({
    where: { sessionId },
    _max: { ligne: true },
  })

  await prisma.entry.create({
    data: {
      sessionId,
      ligne: (lastEntry._max.ligne ?? 0) + 1,
      valeurs: result.data,
      statut: "valide",
    },
  })

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/agents/sessions/${sessionId}`)
  revalidatePath(`/sessions/${sessionId}/saisie`)

  return {}
}

export async function updateEntry(
  entryId: string,
  sessionId: string,
  input: EntryValues
): Promise<CreateEntryResult> {
  await requireAuth()

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    include: { template: { include: { fields: true } } },
  })

  if (!tractageSession) {
    return { error: "Session introuvable" }
  }

  const result = validateEntry(tractageSession.template.fields, input)

  if (!result.success) {
    return { fieldErrors: result.errors }
  }

  await prisma.entry.update({
    where: { id: entryId },
    data: { valeurs: result.data, statut: "valide" },
  })

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/agents/sessions/${sessionId}`)
  revalidatePath(`/sessions/${sessionId}/saisie`)

  return {}
}

export async function confirmEntry(
  entryId: string,
  sessionId: string
): Promise<ActionResult> {
  await requireAuth()

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    include: { template: { include: { fields: true } } },
  })

  if (!tractageSession) {
    return { error: "Session introuvable" }
  }

  const entry = await prisma.entry.findUnique({ where: { id: entryId } })
  if (!entry) {
    return { error: "Entrée introuvable" }
  }

  const valeurs = (entry.valeurs ?? {}) as Record<string, unknown>
  const stringValues = Object.fromEntries(
    tractageSession.template.fields.map((field) => [
      field.key,
      String(valeurs[field.key] ?? ""),
    ])
  )

  const result = validateEntry(tractageSession.template.fields, stringValues)
  if (!result.success) {
    return {
      error: "Corrige les champs invalides avant de valider cette entrée",
    }
  }

  await prisma.entry.update({
    where: { id: entryId },
    data: { statut: "valide" },
  })

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/agents/sessions/${sessionId}`)
  revalidatePath(`/sessions/${sessionId}/saisie`)

  return {}
}

export async function validateSession(
  sessionId: string
): Promise<ActionResult> {
  await requireAuth()

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    include: { entries: true },
  })

  if (!tractageSession) {
    return { error: "Session introuvable" }
  }

  if (tractageSession.statut !== "en_cours") {
    return { error: "Cette session n'est plus en cours" }
  }

  if (tractageSession.entries.length === 0) {
    return { error: "Ajoute au moins une entrée avant de valider" }
  }

  const notValide = tractageSession.entries.filter(
    (entry) => entry.statut !== "valide"
  )
  if (notValide.length > 0) {
    return {
      error: `${notValide.length} entrée(s) restent à vérifier avant de valider la session`,
    }
  }

  await prisma.tractageSession.update({
    where: { id: sessionId },
    data: { statut: "valide" },
  })

  revalidatePath("/admin/sessions")
  revalidatePath("/agents/sessions")
  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/agents/sessions/${sessionId}`)

  return {}
}

export async function deleteEntry(
  entryId: string,
  sessionId: string
): Promise<ActionResult> {
  await requireAuth()

  const entry = await prisma.entry.findUnique({ where: { id: entryId } })
  if (!entry || entry.sessionId !== sessionId) {
    return { error: "Entrée introuvable" }
  }

  await prisma.entry.delete({ where: { id: entryId } })

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/agents/sessions/${sessionId}`)
  revalidatePath(`/sessions/${sessionId}/saisie`)
  revalidatePath("/admin/verification")

  return {}
}

export async function deleteSession(sessionId: string): Promise<ActionResult> {
  await requireAuth()

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id: sessionId },
  })

  if (!tractageSession || tractageSession.deletedAt) {
    return { error: "Session introuvable" }
  }

  await prisma.tractageSession.update({
    where: { id: sessionId },
    data: { deletedAt: new Date() },
  })

  revalidatePath("/admin/sessions")
  revalidatePath("/agents/sessions")
  revalidatePath("/admin/verification")

  return {}
}

type ConfirmAllResult = ActionResult & {
  confirmed?: number
  skipped?: number
}

export async function confirmAllEntries(
  sessionId: string
): Promise<ConfirmAllResult> {
  await requireAuth()

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    include: {
      template: { include: { fields: true } },
      entries: { where: { statut: "a_verifier" } },
    },
  })

  if (!tractageSession) {
    return { error: "Session introuvable" }
  }

  let confirmed = 0
  let skipped = 0

  for (const entry of tractageSession.entries) {
    const valeurs = (entry.valeurs ?? {}) as Record<string, unknown>
    const stringValues = Object.fromEntries(
      tractageSession.template.fields.map((field) => [
        field.key,
        String(valeurs[field.key] ?? ""),
      ])
    )

    const result = validateEntry(tractageSession.template.fields, stringValues)
    if (!result.success) {
      skipped++
      continue
    }

    await prisma.entry.update({
      where: { id: entry.id },
      data: { statut: "valide" },
    })
    confirmed++
  }

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/agents/sessions/${sessionId}`)
  revalidatePath(`/sessions/${sessionId}/saisie`)

  return { confirmed, skipped }
}
