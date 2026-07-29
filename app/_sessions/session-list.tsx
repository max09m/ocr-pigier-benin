import Link from "next/link"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ClipboardListIcon } from "lucide-react"
import { SOURCE_LABELS } from "@/lib/validations/session"
import { CreateSessionDialog } from "./create-session-dialog"

const STATUT_LABELS: Record<string, string> = {
  en_cours: "En cours",
  valide: "Validée",
  exporte: "Exportée",
}

const STATUT_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  en_cours: "outline",
  valide: "secondary",
  exporte: "default",
}

export async function SessionList({ basePath }: { basePath: string }) {
  const [sessions, templates] = await Promise.all([
    prisma.tractageSession.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { template: true, _count: { select: { entries: true } } },
    }),
    prisma.template.findMany({
      where: { actif: true },
      orderBy: { nom: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sessions de tractage</h1>
          <p className="text-sm text-muted-foreground">
            Une session correspond à une feuille remplie pour un établissement
            et une date.
          </p>
        </div>
        {sessions.length > 0 && (
          <CreateSessionDialog basePath={basePath} templates={templates} />
        )}
      </div>

      {sessions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardListIcon />
            </EmptyMedia>
            <EmptyTitle>Aucune session</EmptyTitle>
            <EmptyDescription>
              Crée une session pour commencer à collecter des contacts sur un
              établissement.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateSessionDialog basePath={basePath} templates={templates} />
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Établissement</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Entrées</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((tractageSession) => (
              <TableRow key={tractageSession.id}>
                <TableCell>
                  <Link
                    href={`${basePath}/${tractageSession.id}`}
                    className="font-medium hover:underline"
                  >
                    {tractageSession.etablissement}
                  </Link>
                </TableCell>
                <TableCell>
                  {tractageSession.dateTractage.toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>{tractageSession.template.nom}</TableCell>
                <TableCell>{SOURCE_LABELS[tractageSession.source]}</TableCell>
                <TableCell>{tractageSession._count.entries}</TableCell>
                <TableCell>
                  <Badge variant={STATUT_VARIANTS[tractageSession.statut]}>
                    {STATUT_LABELS[tractageSession.statut]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
