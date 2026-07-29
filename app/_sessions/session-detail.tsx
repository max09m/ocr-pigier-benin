import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, PenLineIcon } from "lucide-react"
import { SOURCE_LABELS } from "@/lib/validations/session"
import { EntriesTable } from "./entries-table"
import { ExportDialog } from "./export-dialog"
import { OcrUploadDialog } from "./ocr-upload-dialog"
import { ValidateSessionButton } from "./validate-session-button"
import { ConfirmAllEntriesButton } from "./confirm-all-entries-button"
import { DeleteSessionButton } from "./delete-session-button"

const STATUT_LABELS: Record<string, string> = {
  en_cours: "En cours",
  valide: "Validée",
  exporte: "Exportée",
}

export async function SessionDetail({
  basePath,
  id,
}: {
  basePath: string
  id: string
}) {
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
  const hasUnverified = tractageSession.entries.some(
    (entry) => entry.statut === "a_verifier"
  )

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={basePath}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeftIcon className="size-3.5" />
        Sessions de tractage
      </Link>

      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">
            {tractageSession.etablissement}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tractageSession.dateTractage.toLocaleDateString("fr-FR")} ·
            Template {tractageSession.template.nom}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {SOURCE_LABELS[tractageSession.source]}
          </Badge>
          <Badge>{STATUT_LABELS[tractageSession.statut]}</Badge>
          {tractageSession.statut === "en_cours" &&
            tractageSession.entries.length > 0 && (
              <ValidateSessionButton sessionId={tractageSession.id} />
            )}
          {tractageSession.entries.length > 0 && (
            <ExportDialog
              sessionId={tractageSession.id}
              etablissement={tractageSession.etablissement}
              fields={activeFields}
              entries={tractageSession.entries}
            />
          )}
          <DeleteSessionButton
            sessionId={tractageSession.id}
            basePath={basePath}
          />
        </div>
      </div>

      {tractageSession.source === "tablette" ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              Entrées ({tractageSession.entries.length})
            </h2>
            <div className="flex items-center gap-2">
              {hasUnverified && (
                <ConfirmAllEntriesButton sessionId={tractageSession.id} />
              )}
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={`/sessions/${tractageSession.id}/saisie?from=${encodeURIComponent(basePath)}`}
                  />
                }
              >
                <PenLineIcon />
                Ouvrir la saisie
              </Button>
            </div>
          </div>
          <EntriesTable
            sessionId={tractageSession.id}
            fields={activeFields}
            entries={tractageSession.entries}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              Entrées ({tractageSession.entries.length})
            </h2>
            <div className="flex items-center gap-2">
              {hasUnverified && (
                <ConfirmAllEntriesButton sessionId={tractageSession.id} />
              )}
              <OcrUploadDialog sessionId={tractageSession.id} />
            </div>
          </div>
          <EntriesTable
            sessionId={tractageSession.id}
            fields={activeFields}
            entries={tractageSession.entries}
          />
        </div>
      )}
    </div>
  )
}
