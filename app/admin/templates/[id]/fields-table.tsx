"use client"

import { useTransition } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Columns3Icon } from "lucide-react"
import { CreateFieldDialog } from "./create-field-dialog"
import { EditFieldDialog } from "./edit-field-dialog"
import { toggleFieldActif } from "../actions"
import { FIELD_TYPE_LABELS } from "@/lib/validations/template"
import type { Field as FieldModel } from "@/app/generated/prisma/client"

export function FieldsTable({
  templateId,
  fields,
}: {
  templateId: string
  fields: FieldModel[]
}) {
  const [, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Champs du formulaire</h2>
        {fields.length > 0 && (
          <CreateFieldDialog
            templateId={templateId}
            defaultOrdre={fields.length + 1}
          />
        )}
      </div>

      {fields.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Columns3Icon />
            </EmptyMedia>
            <EmptyTitle>Aucun champ</EmptyTitle>
            <EmptyDescription>
              Ajoute les colonnes du formulaire (nom, téléphone, etc.). Elles
              piloteront le schéma OCR, le formulaire tablette et l&apos;export
              Excel.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateFieldDialog
              templateId={templateId}
              defaultOrdre={fields.length + 1}
            />
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordre</TableHead>
              <TableHead>Clé</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Requis</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.id}>
                <TableCell>{field.ordre}</TableCell>
                <TableCell className="font-mono text-xs">
                  {field.key}
                </TableCell>
                <TableCell>{field.label}</TableCell>
                <TableCell>{FIELD_TYPE_LABELS[field.type]}</TableCell>
                <TableCell>
                  {field.requis ? (
                    <Badge variant="outline">Requis</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={field.actif}
                    onCheckedChange={(checked) =>
                      startTransition(() =>
                        toggleFieldActif(
                          field.id,
                          templateId,
                          checked === true
                        )
                      )
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <EditFieldDialog templateId={templateId} field={field} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
