"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import { confirmEntry } from "./actions"

export function ConfirmEntryButton({
  sessionId,
  entryId,
}: {
  sessionId: string
  entryId: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await confirmEntry(entryId, sessionId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Entrée validée")
    })
  }

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Valider l'entrée"
    >
      <CheckIcon />
    </Button>
  )
}
