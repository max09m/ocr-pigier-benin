import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { TemplateActifToggle } from "./template-actif-toggle"
import { FieldsTable } from "./fields-table"

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const template = await prisma.template.findUnique({
    where: { id },
    include: { fields: { orderBy: { ordre: "asc" } } },
  })

  if (!template) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl font-semibold">{template.nom}</h1>
            <p className="text-sm text-muted-foreground">
              Année {template.annee}
            </p>
          </div>
          <Badge variant={template.actif ? "default" : "secondary"}>
            {template.actif ? "Actif" : "Inactif"}
          </Badge>
        </div>
        <TemplateActifToggle templateId={template.id} actif={template.actif} />
      </div>

      <FieldsTable templateId={template.id} fields={template.fields} />
    </div>
  )
}
