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
import { PlusIcon } from "lucide-react"
import { EntryForm } from "./entry-form"
import type { Field as FieldModel } from "@/app/generated/prisma/client"

export function CreateEntryDialog({
  sessionId,
  fields,
}: {
  sessionId: string
  fields: FieldModel[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button disabled={fields.length === 0}>
            <PlusIcon />
            Ajouter
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle entrée</DialogTitle>
        </DialogHeader>
        <EntryForm
          sessionId={sessionId}
          fields={fields}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
