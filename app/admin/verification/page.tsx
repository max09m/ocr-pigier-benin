import Link from "next/link"
import prisma from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScanTextIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFieldValue } from "@/lib/format"
import { entryHasIssues } from "@/lib/validations/entry"
import { ConfirmEntryButton } from "@/app/_sessions/confirm-entry-button"

export default async function VerificationPage() {
  const entries = await prisma.entry.findMany({
    where: { statut: "a_verifier" },
    include: {
      session: {
        include: {
          template: {
            include: {
              fields: { where: { actif: true }, orderBy: { ordre: "asc" } },
            },
          },
        },
      },
    },
    orderBy: [{ session: { dateTractage: "desc" } }, { ligne: "asc" }],
  })

  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ScanTextIcon />
          </EmptyMedia>
          <EmptyTitle>Rien à vérifier</EmptyTitle>
          <EmptyDescription>
            Toutes les entrées issues de l&apos;OCR ont été confirmées.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Vérification OCR</h1>
        <p className="text-sm text-muted-foreground">
          Entrées issues de l&apos;OCR en attente de confirmation, toutes
          sessions confondues ({entries.length}).
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>N°</TableHead>
            <TableHead>Aperçu</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const fields = entry.session.template.fields
            const valeurs = (entry.valeurs ?? {}) as Record<string, unknown>
            const preview = fields
              .map(
                (field) =>
                  `${field.label} : ${formatFieldValue(field, valeurs[field.key])}`
              )
              .join(" · ")
            const hasIssues = entryHasIssues(fields, valeurs)

            return (
              <TableRow
                key={entry.id}
                className={cn(
                  hasIssues && "border-l-2 border-l-destructive bg-destructive/5"
                )}
              >
                <TableCell>
                  <Link
                    href={`/admin/sessions/${entry.session.id}`}
                    className="font-medium hover:underline"
                  >
                    {entry.session.etablissement}
                  </Link>
                </TableCell>
                <TableCell>
                  {entry.session.dateTractage.toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>{entry.ligne}</TableCell>
                <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                  {preview}
                </TableCell>
                <TableCell className="text-right">
                  <ConfirmEntryButton
                    sessionId={entry.session.id}
                    entryId={entry.id}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
