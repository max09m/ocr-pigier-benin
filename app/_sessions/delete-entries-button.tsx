"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import { deleteEntries } from "./actions"

export function DeleteEntriesButton({
  sessionId,
  entryIds,
  onDeleted,
}: {
  sessionId: string
  entryIds: string[]
  onDeleted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteEntries(entryIds, sessionId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(
        `${result.deleted ?? entryIds.length} entrée(s) supprimée(s)`
      )
      setOpen(false)
      onDeleted?.()
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2Icon />
            Supprimer ({entryIds.length})
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Supprimer {entryIds.length} entrée(s) ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ces lignes seront définitivement supprimées. Cette action est
            irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
