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
import { PencilIcon } from "lucide-react"
import {
  updateFieldSchema,
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  type UpdateFieldValues,
} from "@/lib/validations/template"
import { updateField } from "../actions"
import type { Field as FieldModel } from "@/app/generated/prisma/client"

export function EditFieldDialog({
  templateId,
  field: fieldRecord,
}: {
  templateId: string
  field: FieldModel
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateFieldSchema),
    defaultValues: {
      label: fieldRecord.label,
      type: fieldRecord.type,
      requis: fieldRecord.requis,
      options: Array.isArray(fieldRecord.options)
        ? (fieldRecord.options as string[])
        : [],
      ordre: fieldRecord.ordre,
    },
  })

  const type = watch("type")

  function onSubmit(values: UpdateFieldValues) {
    startTransition(async () => {
      const result = await updateField(fieldRecord.id, templateId, values)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success("Champ modifié")
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="icon-sm">
            <PencilIcon />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier « {fieldRecord.label} »</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.label}>
              <FieldLabel htmlFor="edit-label">Libellé</FieldLabel>
              <Input id="edit-label" {...register("label")} />
              <FieldError errors={[errors.label]} />
            </Field>

            <Field data-invalid={!!errors.type}>
              <FieldLabel htmlFor="edit-type">Type</FieldLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-type" className="w-full">
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
                <FieldLabel htmlFor="edit-options">Options</FieldLabel>
                <Controller
                  name="options"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      id="edit-options"
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
              <FieldLabel htmlFor="edit-ordre">Ordre</FieldLabel>
              <Input id="edit-ordre" type="number" {...register("ordre")} />
              <FieldError errors={[errors.ordre]} />
            </Field>

            <Field orientation="horizontal">
              <Controller
                name="requis"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="edit-requis"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldLabel htmlFor="edit-requis">Champ obligatoire</FieldLabel>
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
