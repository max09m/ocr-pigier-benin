"use client"

import { useState, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon } from "lucide-react"
import {
  createUserSchema,
  USER_ROLES,
  USER_ROLE_LABELS,
  type CreateUserValues,
} from "@/lib/validations/user"
import { createUserAccount } from "./actions"

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "agent" as const,
    },
  })

  function onSubmit(values: CreateUserValues) {
    startTransition(async () => {
      const result = await createUserAccount(values)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Compte créé")
      reset()
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <PlusIcon />
            Nouveau compte
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau compte</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Nom</FieldLabel>
              <Input id="name" placeholder="Aurélie K." {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="agent@pigierbenin.com"
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Mot de passe temporaire</FieldLabel>
              <Input id="password" type="text" {...register("password")} />
              <FieldError errors={[errors.password]} />
            </Field>

            <Field data-invalid={!!errors.role}>
              <FieldLabel htmlFor="role">Rôle</FieldLabel>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Choisir un rôle">
                        {(value: (typeof USER_ROLES)[number]) =>
                          USER_ROLE_LABELS[value] ?? "Choisir un rôle"
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
                )}
              />
              <FieldError errors={[errors.role]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création..." : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
