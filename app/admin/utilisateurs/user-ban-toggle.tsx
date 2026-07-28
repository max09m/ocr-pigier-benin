"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { toggleUserBan } from "./actions"

export function UserBanToggle({
  userId,
  banned,
  disabled,
}: {
  userId: string
  banned: boolean
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await toggleUserBan(userId, !banned)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(banned ? "Compte débanni" : "Compte banni")
    })
  }

  return (
    <Button
      variant={banned ? "outline" : "destructive"}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isPending}
    >
      {banned ? "Débannir" : "Bannir"}
    </Button>
  )
}
