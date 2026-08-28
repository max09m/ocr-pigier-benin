"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { s3Client, STORAGE_BUCKET } from "@/lib/s3-client"
import { mistral, OCR_MODEL, buildOcrSchema } from "@/lib/mistral"
import { uploadRequestSchema } from "@/lib/validations/upload"
import {
  normalizePhone,
  normalizeDate,
  PHONE_REGEX,
} from "@/lib/validations/entry"

type UploadUrlResult = { error: string } | { url: string; key: string }

export async function getUploadUrl(input: unknown): Promise<UploadUrlResult> {
  await requireAuth()

  const parsed = uploadRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Fichier invalide" }
  }

  const key = `tractage/${randomUUID()}-${parsed.data.fileName}`

  const url = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      ContentType: parsed.data.contentType,
    }),
    { expiresIn: 300 }
  )

  return { url, key }
}

type ProcessOcrResult = { error?: string; created?: number }

export async function processOcrUpload(
  sessionId: string,
  fileKeys: string[]
): Promise<ProcessOcrResult> {
  await requireAuth()

  if (fileKeys.length === 0) {
    return { error: "Aucun fichier à traiter" }
  }

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id: sessionId, deletedAt: null },
    include: {
      template: {
        include: {
          fields: { where: { actif: true }, orderBy: { ordre: "asc" } },
        },
      },
      entries: true,
    },
  })

  if (!tractageSession) {
    return { error: "Session introuvable" }
  }

  const fields = tractageSession.template.fields
  const schema = buildOcrSchema(fields)

  let nextLigne = tractageSession.entries.length + 1
  let created = 0

  try {
    for (const key of fileKeys) {
      const documentUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }),
        { expiresIn: 600 }
      )

      const result = await mistral.ocr.process({
        model: OCR_MODEL,
        document: { type: "document_url", documentUrl },
        documentAnnotationFormat: {
          type: "json_schema",
          jsonSchema: { name: "tractage", schemaDefinition: schema },
        },
      })

      if (!result.documentAnnotation) continue

      const parsed = JSON.parse(result.documentAnnotation) as {
        lignes?: Record<string, unknown>[]
      }

      for (const ligneValeurs of parsed.lignes ?? []) {
        const valeurs: Record<string, string | number> = {}
        for (const field of fields) {
          const value = ligneValeurs[field.key]
          if (value == null || value === "") continue

          if (field.type === "tel") {
            const normalized = normalizePhone(String(value))
            if (PHONE_REGEX.test(normalized)) {
              valeurs[field.key] = normalized
            }
            continue
          }

          if (field.type === "date") {
            const normalized = normalizeDate(String(value))
            if (normalized) {
              valeurs[field.key] = normalized
            }
            continue
          }

          valeurs[field.key] = value as string | number
        }

        if (Object.keys(valeurs).length === 0) continue

        await prisma.entry.create({
          data: {
            sessionId,
            ligne: nextLigne,
            valeurs,
            confiance: undefined,
            statut: "a_verifier",
          },
        })
        nextLigne++
        created++
      }
    }
  } catch (error) {
    console.error("Erreur OCR:", error)
    return { error: "Le traitement OCR a échoué. Réessaie." }
  }

  await prisma.tractageSession.update({
    where: { id: sessionId },
    data: { fichierUrl: fileKeys[0] },
  })

  revalidatePath(`/admin/sessions/${sessionId}`)
  revalidatePath(`/agents/sessions/${sessionId}`)
  revalidatePath(`/sessions/${sessionId}/saisie`)

  return { created }
}
