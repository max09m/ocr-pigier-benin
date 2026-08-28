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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon } from "lucide-react"
import {
  sessionSchema,
  SOURCE_OPTIONS,
  SOURCE_LABELS,
  type SessionFormValues,
} from "@/lib/validations/session"
import { createSession } from "./actions"
import type { Template } from "@/app/generated/prisma/client"

export function CreateSessionDialog({
  basePath,
  templates,
  dialogTitle = "Nouvelle session de tractage",
}: {
  basePath: string
  templates: Template[]
  dialogTitle?: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      etablissement: "",
      dateTractage: "",
      templateId: templates[0]?.id ?? "",
      source: "tablette" as const,
    },
  })

  function onSubmit(values: SessionFormValues) {
    startTransition(async () => {
      const result = await createSession(basePath, values)
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
          <Button disabled={templates.length === 0}>
            <PlusIcon />
            Nouvelle session
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun template actif. Un administrateur doit d&apos;abord en créer
            un dans « Templates ».
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field data-invalid={!!errors.etablissement}>
                <FieldLabel htmlFor="etablissement">Établissement</FieldLabel>
                <Input
                  id="etablissement"
                  placeholder="CEG Lé Hokoué"
                  {...register("etablissement")}
                />
                <FieldError errors={[errors.etablissement]} />
              </Field>

              <Field data-invalid={!!errors.dateTractage}>
                <FieldLabel htmlFor="dateTractage">Date</FieldLabel>
                <Controller
                  name="dateTractage"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      id="dateTractage"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FieldError errors={[errors.dateTractage]} />
              </Field>

              <Field data-invalid={!!errors.templateId}>
                <FieldLabel htmlFor="templateId">Template</FieldLabel>
                <Controller
                  name="templateId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="templateId" className="w-full">
                        <SelectValue placeholder="Choisir un template">
                          {(value: string) => {
                            const template = templates.find(
                              (item) => item.id === value
                            )
                            return template
                              ? `${template.nom} (${template.annee})`
                              : "Choisir un template"
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.nom} ({template.annee})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.templateId]} />
              </Field>

              <Field data-invalid={!!errors.source}>
                <FieldLabel htmlFor="source">Source</FieldLabel>
                <Controller
                  name="source"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="source" className="w-full">
                        <SelectValue placeholder="Choisir une source">
                          {(value: (typeof SOURCE_OPTIONS)[number]) =>
                            SOURCE_LABELS[value] ?? "Choisir une source"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {SOURCE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.source]} />
              </Field>
            </FieldGroup>

            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Création..." : "Créer la session"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
