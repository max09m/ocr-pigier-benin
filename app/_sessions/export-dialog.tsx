"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
  const [selectedKeys, setSelectedKeys] = useState(
    () => new Set(fields.map((field) => field.key))
  )

  const visibleFields = fields.filter((field) => selectedKeys.has(field.key))
  const exportHref = `/api/sessions/${sessionId}/export?fields=${encodeURIComponent([...selectedKeys].join(","))}`

  function toggleKey(key: string, checked: boolean) {
    setSelectedKeys((old) => {
      const next = new Set(old)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
  }

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

        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded border p-3">
          {fields.map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <Checkbox
                id={`export-field-${field.key}`}
                checked={selectedKeys.has(field.key)}
                onCheckedChange={(checked) => toggleKey(field.key, !!checked)}
              />
              <Label
                htmlFor={`export-field-${field.key}`}
                className="text-sm font-normal"
              >
                {field.label}
              </Label>
            </div>
          ))}
        </div>

        <div className="max-h-80 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                {visibleFields.map((field) => (
                  <TableHead key={field.key}>{field.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const valeurs = (entry.valeurs ?? {}) as Record<string, unknown>
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.ligne}</TableCell>
                    {visibleFields.map((field) => (
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
            disabled={selectedKeys.size === 0}
            nativeButton={false}
            render={<a href={exportHref} onClick={() => setOpen(false)} />}
          >
            <FileSpreadsheetIcon />
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
