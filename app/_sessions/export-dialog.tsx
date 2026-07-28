"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileSpreadsheetIcon } from "lucide-react"
import { formatFieldValue } from "@/lib/format"
import type { Entry, Field as FieldModel } from "@/app/generated/prisma/client"

export function ExportDialog({
  sessionId,
  etablissement,
  fields,
  entries,
}: {
  sessionId: string
  etablissement: string
  fields: FieldModel[]
  entries: Entry[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <FileSpreadsheetIcon />
            Exporter
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exporter « {etablissement} »</DialogTitle>
          <DialogDescription>
            Aperçu du fichier Excel avant export ({entries.length} entrée
            {entries.length > 1 ? "s" : ""}).
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                {fields.map((field) => (
                  <TableHead key={field.key}>{field.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const valeurs = (entry.valeurs ?? {}) as Record<
                  string,
                  unknown
                >
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.ligne}</TableCell>
                    {fields.map((field) => (
                      <TableCell key={field.key}>
                        {formatFieldValue(field, valeurs[field.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            nativeButton={false}
            render={
              <a
                href={`/api/sessions/${sessionId}/export`}
                onClick={() => setOpen(false)}
              />
            }
          >
            <FileSpreadsheetIcon />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
