"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CheckCheckIcon } from "lucide-react"
import { validateSession } from "./actions"

export function ValidateSessionButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await validateSession(sessionId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Session validée")
    })
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      <CheckCheckIcon />
      Valider la session
    </Button>
  )
}
