"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

type PasswordFormValues = {
  currentPassword: string
  newPassword: string
}

export function PasswordForm() {
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: "", newPassword: "" },
  })

  function onSubmit(values: PasswordFormValues) {
    startTransition(async () => {
      await authClient.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Mot de passe modifié")
            reset()
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
      <h2 className="text-sm font-medium">Mot de passe</h2>
      <FieldGroup>
        <Field data-invalid={!!errors.currentPassword}>
          <FieldLabel htmlFor="currentPassword">
            Mot de passe actuel
          </FieldLabel>
          <Input
            id="currentPassword"
            type="password"
            {...register("currentPassword", { required: "Requis" })}
          />
          <FieldError errors={[errors.currentPassword]} />
        </Field>
        <Field data-invalid={!!errors.newPassword}>
          <FieldLabel htmlFor="newPassword">Nouveau mot de passe</FieldLabel>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword", {
              required: "Requis",
              minLength: { value: 8, message: "8 caractères minimum" },
            })}
          />
          <FieldError errors={[errors.newPassword]} />
        </Field>
      </FieldGroup>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement..." : "Changer le mot de passe"}
        </Button>
      </div>
    </form>
  )
}
