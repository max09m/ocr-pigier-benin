"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { toggleTemplateActif } from "../actions"

export function TemplateActifToggle({
  templateId,
  actif,
}: {
  templateId: string
  actif: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await toggleTemplateActif(templateId, !actif)
    })
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      {actif ? "Désactiver" : "Activer"}
    </Button>
  )
}
