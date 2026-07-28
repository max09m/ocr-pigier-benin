"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
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
import { PlusIcon } from "lucide-react"
import { templateSchema, type TemplateFormValues } from "@/lib/validations/template"
import { createTemplate } from "./actions"

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: { nom: "", annee: new Date().getFullYear() },
  })

  function onSubmit(values: TemplateFormValues) {
    startTransition(async () => {
      const result = await createTemplate(values)
      if (result?.error) {
        toast.error(result.error)
      }
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
            Nouveau template
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.nom}>
              <FieldLabel htmlFor="nom">Nom</FieldLabel>
              <Input
                id="nom"
                placeholder="Tractage 2026"
                {...register("nom")}
              />
              <FieldError errors={[errors.nom]} />
            </Field>

            <Field data-invalid={!!errors.annee}>
              <FieldLabel htmlFor="annee">Année</FieldLabel>
              <Input id="annee" type="number" {...register("annee")} />
              <FieldError errors={[errors.annee]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création..." : "Créer le template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
