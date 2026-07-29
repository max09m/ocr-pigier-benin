import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { ArrowLeftIcon } from "lucide-react"
import { EntriesTable } from "@/app/_sessions/entries-table"
import { CreateEntryDialog } from "@/app/_sessions/create-entry-dialog"

export default async function SaisiePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  await requireAuth()

  const { id } = await params
  const { from } = await searchParams
  const backHref = from || "/agents/sessions"

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id, deletedAt: null },
    include: {
      template: {
        include: {
          fields: { where: { actif: true }, orderBy: { ordre: "asc" } },
        },
      },
      entries: { orderBy: { ligne: "asc" } },
    },
  })

  if (!tractageSession) {
    notFound()
  }

  const activeFields = tractageSession.template.fields

  return (
    <div className="flex min-h-svh flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={backHref}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeftIcon className="size-3.5" />
          {tractageSession.etablissement}
        </Link>
        <CreateEntryDialog
          sessionId={tractageSession.id}
          fields={activeFields}
        />
      </div>

      <EntriesTable
        sessionId={tractageSession.id}
        fields={activeFields}
        entries={tractageSession.entries}
      />
    </div>
  )
}
