"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CheckCheckIcon } from "lucide-react"
import { confirmAllEntries } from "./actions"

export function ConfirmAllEntriesButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await confirmAllEntries(sessionId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      const confirmed = result.confirmed ?? 0
      const skipped = result.skipped ?? 0

      if (confirmed === 0 && skipped === 0) {
        toast.info("Aucune entrée à vérifier")
        return
      }

      if (skipped > 0) {
        toast.warning(
          `${confirmed} entrée(s) validée(s), ${skipped} nécessite(nt) encore une correction`
        )
        return
      }

      toast.success(`${confirmed} entrée(s) validée(s)`)
    })
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      <CheckCheckIcon />
      Tout valider
    </Button>
  )
}
