"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PencilIcon } from "lucide-react"
import { normalizeDate } from "@/lib/validations/entry"
import { EntryForm } from "./entry-form"
import type { Entry, Field as FieldModel } from "@/app/generated/prisma/client"

export function EditEntryDialog({
  sessionId,
  fields,
  entry,
}: {
  sessionId: string
  fields: FieldModel[]
  entry: Entry
}) {
  const [open, setOpen] = useState(false)
  const valeurs = (entry.valeurs ?? {}) as Record<string, unknown>
  const initialValues = Object.fromEntries(
    fields.map((field) => {
      const raw = String(valeurs[field.key] ?? "")
      // Les entrées OCR plus anciennes peuvent contenir une date non
      // normalisée (ex: JJ/MM/AA) ; on la convertit pour que le
      // sélecteur de date puisse l'afficher correctement.
      const value = field.type === "date" ? normalizeDate(raw) || raw : raw
      return [field.key, value]
    })
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon-sm">
            <PencilIcon />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;entrée n° {entry.ligne}</DialogTitle>
        </DialogHeader>
        <EntryForm
          sessionId={sessionId}
          fields={fields}
          entryId={entry.id}
          initialValues={initialValues}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
