"use client"

import { useState, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { TagInput } from "@/components/ui/tag-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon } from "lucide-react"
import {
  createFieldSchema,
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  type CreateFieldValues,
} from "@/lib/validations/template"
import { createField } from "../actions"

export function CreateFieldDialog({
  templateId,
  defaultOrdre,
}: {
  templateId: string
  defaultOrdre: number
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createFieldSchema),
    defaultValues: {
      key: "",
      label: "",
      type: "text",
      requis: false,
      options: [] as string[],
      ordre: defaultOrdre,
    },
  })

  const type = watch("type")

  function onSubmit(values: CreateFieldValues) {
    startTransition(async () => {
      const result = await createField(templateId, values)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Champ ajouté")
      setOpen(false)
      reset()
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
            Ajouter un champ
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un champ</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.key}>
              <FieldLabel htmlFor="key">Clé (technique, immuable)</FieldLabel>
              <Input id="key" placeholder="telephone" {...register("key")} />
              <FieldError errors={[errors.key]} />
            </Field>

            <Field data-invalid={!!errors.label}>
              <FieldLabel htmlFor="label">Libellé</FieldLabel>
              <Input
                id="label"
                placeholder="Téléphone"
                {...register("label")}
              />
              <FieldError errors={[errors.label]} />
            </Field>

            <Field data-invalid={!!errors.type}>
              <FieldLabel htmlFor="type">Type</FieldLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Choisir un type">
                        {(value: (typeof FIELD_TYPES)[number]) =>
                          FIELD_TYPE_LABELS[value] ?? "Choisir un type"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {FIELD_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.type]} />
            </Field>

            {type === "select" && (
              <Field data-invalid={!!errors.options}>
                <FieldLabel htmlFor="options">Options</FieldLabel>
                <Controller
                  name="options"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      id="options"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Tapez une option puis Entrée"
                    />
                  )}
                />
                <FieldError errors={[errors.options]} />
              </Field>
            )}

            <Field data-invalid={!!errors.ordre}>
              <FieldLabel htmlFor="ordre">Ordre</FieldLabel>
              <Input id="ordre" type="number" {...register("ordre")} />
              <FieldError errors={[errors.ordre]} />
            </Field>

            <Field orientation="horizontal">
              <Controller
                name="requis"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="requis"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldLabel htmlFor="requis">Champ obligatoire</FieldLabel>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
