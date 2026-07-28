"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/session"

export type SearchResults = {
  sessions: { id: string; etablissement: string; dateTractage: Date }[]
  templates: { id: string; nom: string; annee: number }[]
  users: { id: string; name: string; email: string }[]
}

export async function searchEntities(query: string): Promise<SearchResults> {
  const session = await requireAuth()
  const trimmed = query.trim()

  if (trimmed.length < 2) {
    return { sessions: [], templates: [], users: [] }
  }

  const isAdmin = session.user.role === "admin"

  const [sessions, templates, users] = await Promise.all([
    prisma.tractageSession.findMany({
      where: { etablissement: { contains: trimmed, mode: "insensitive" } },
      select: { id: true, etablissement: true, dateTractage: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    isAdmin
      ? prisma.template.findMany({
          where: { nom: { contains: trimmed, mode: "insensitive" } },
          select: { id: true, nom: true, annee: true },
          take: 5,
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { email: { contains: trimmed, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  return { sessions, templates, users }
}
