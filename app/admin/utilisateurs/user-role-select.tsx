"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { USER_ROLES, USER_ROLE_LABELS } from "@/lib/validations/user"
import { changeUserRole } from "./actions"

export function UserRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string
  role: string
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value) return

    startTransition(async () => {
      const result = await changeUserRole(
        userId,
        value as (typeof USER_ROLES)[number]
      )
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Rôle mis à jour")
    })
  }

  return (
    <Select
      value={role}
      onValueChange={handleChange}
      disabled={disabled || isPending}
    >
      <SelectTrigger size="sm" className="w-28">
        <SelectValue>
          {(value: (typeof USER_ROLES)[number]) =>
            USER_ROLE_LABELS[value] ?? value
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {USER_ROLES.map((value) => (
          <SelectItem key={value} value={value}>
            {USER_ROLE_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
