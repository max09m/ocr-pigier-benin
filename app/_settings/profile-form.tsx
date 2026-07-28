"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export function ProfileForm({
  name,
  email,
}: {
  name: string
  email: string
}) {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit } = useForm({ defaultValues: { name } })

  function onSubmit(values: { name: string }) {
    startTransition(async () => {
      await authClient.updateUser({
        name: values.name,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Profil mis à jour")
          },
          onError: (error) => {
            toast.error(error.error.message)
          },
        },
      })
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">Profil</h2>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nom</FieldLabel>
          <Input id="name" {...register("name")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" value={email} disabled />
          <FieldDescription>
            L&apos;email ne peut pas être modifié.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
