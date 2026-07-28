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
import { LayoutTemplateIcon } from "lucide-react"
import { CreateTemplateDialog } from "./create-template-dialog"

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { fields: true, sessions: true } } },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Templates de tractage</h1>
          <p className="text-sm text-muted-foreground">
            Un template pilote le formulaire tablette, le schéma OCR et
            l&apos;export Excel.
          </p>
        </div>
        {templates.length > 0 && <CreateTemplateDialog />}
      </div>

      {templates.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutTemplateIcon />
            </EmptyMedia>
            <EmptyTitle>Aucun template</EmptyTitle>
            <EmptyDescription>
              Crée un premier template pour piloter le formulaire tablette, le
              schéma OCR et l&apos;export Excel.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateTemplateDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Année</TableHead>
              <TableHead>Champs</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <Link
                    href={`/admin/templates/${template.id}`}
                    className="font-medium hover:underline"
                  >
                    {template.nom}
                  </Link>
                </TableCell>
                <TableCell>{template.annee}</TableCell>
                <TableCell>{template._count.fields}</TableCell>
                <TableCell>{template._count.sessions}</TableCell>
                <TableCell>
                  <Badge variant={template.actif ? "default" : "secondary"}>
                    {template.actif ? "Actif" : "Inactif"}
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
