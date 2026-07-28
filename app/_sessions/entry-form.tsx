"use client"

import { useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEntry, updateEntry } from "./actions"
import type { Field as FieldModel } from "@/app/generated/prisma/client"

export function EntryForm({
  sessionId,
  fields,
  entryId,
  initialValues,
  onSuccess,
}: {
  sessionId: string
  fields: FieldModel[]
  entryId?: string
  initialValues?: Record<string, string>
  onSuccess?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<Record<string, string>>({
    defaultValues:
      initialValues ??
      Object.fromEntries(fields.map((field) => [field.key, ""])),
  })

  function onSubmit(values: Record<string, string>) {
    startTransition(async () => {
      const result = entryId
        ? await updateEntry(entryId, sessionId, values)
        : await createEntry(sessionId, values)

      if (result.fieldErrors) {
        for (const [key, message] of Object.entries(result.fieldErrors)) {
          setError(key, { message })
        }
        return
      }

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(entryId ? "Entrée modifiée" : "Entrée ajoutée")
      if (!entryId) reset()
      onSuccess?.()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const options = Array.isArray(field.options)
            ? (field.options as string[])
            : []

          return (
            <Field key={field.key} data-invalid={!!errors[field.key]}>
              <FieldLabel htmlFor={field.key}>
                {field.label}
                {field.requis && <span className="text-destructive"> *</span>}
              </FieldLabel>

              {field.type === "select" ? (
                <Controller
                  name={field.key}
                  control={control}
                  render={({ field: rhfField }) => (
                    <Select
                      value={rhfField.value}
                      onValueChange={rhfField.onChange}
                    >
                      <SelectTrigger id={field.key} className="w-full">
                        <SelectValue placeholder="Choisir...">
                          {(value: string) => value || "Choisir..."}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : field.type === "date" ? (
                <Controller
                  name={field.key}
                  control={control}
                  render={({ field: rhfField }) => (
                    <DatePicker
                      id={field.key}
                      value={rhfField.value}
                      onChange={rhfField.onChange}
                    />
                  )}
                />
              ) : (
                <Input
                  id={field.key}
                  type={
                    field.type === "number"
                      ? "number"
                      : field.type === "email"
                        ? "email"
                        : field.type === "tel"
                          ? "tel"
                          : "text"
                  }
                  {...register(field.key)}
                />
              )}

              <FieldError errors={[errors[field.key]]} />
            </Field>
          )
        })}
      </FieldGroup>

      <div>
        <Button type="submit" disabled={isPending || fields.length === 0}>
          {isPending
            ? "Enregistrement..."
            : entryId
              ? "Enregistrer"
              : "Ajouter l'entrée"}
        </Button>
      </div>
    </form>
  )
}
