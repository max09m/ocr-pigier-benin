"use client"

import { useState, useTransition } from "react"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload"
import {
  CircleAlertIcon,
  FileTextIcon,
  UploadIcon,
  XIcon,
  ScanTextIcon,
} from "lucide-react"
import { getUploadUrl, processOcrUpload } from "./ocr-actions"

export function OcrUploadDialog({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false)
  const [isProcessing, startTransition] = useTransition()

  const [
    { files, isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024,
    accept: "image/*,application/pdf",
    multiple: true,
  })

  function handleImport() {
    startTransition(async () => {
      const keys: string[] = []

      for (const fileItem of files) {
        if (!(fileItem.file instanceof File)) continue
        const file = fileItem.file

        const uploadUrl = await getUploadUrl({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        })

        if ("error" in uploadUrl) {
          toast.error(uploadUrl.error)
          return
        }

        const putResponse = await fetch(uploadUrl.url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!putResponse.ok) {
          toast.error(`Échec de l'envoi de "${file.name}"`)
          return
        }

        keys.push(uploadUrl.key)
      }

      if (keys.length === 0) {
        toast.error("Aucun fichier sélectionné")
        return
      }

      const result = await processOcrUpload(sessionId, keys)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(`${result.created ?? 0} ligne(s) extraite(s), à vérifier`)
      clearFiles()
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <ScanTextIcon />
            Importer une feuille
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importer une feuille manuscrite</DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            "relative rounded-lg border border-dashed p-8 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input {...getInputProps()} className="sr-only" />

          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDragging ? "bg-primary/10" : "bg-muted"
              )}
            >
              <UploadIcon
                className={cn(
                  "size-5",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Glisse une photo ou un PDF, ou clique pour parcourir
              </p>
              <p className="text-xs text-muted-foreground">
                Images ou PDF, 20 Mo max par fichier
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
            >
              Choisir des fichiers
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {files.map((fileItem) => (
              <li
                key={fileItem.id}
                className="flex items-center justify-between gap-2 border px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{fileItem.file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(fileItem.file.size)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFile(fileItem.id)}
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Erreur de fichier</AlertTitle>
            <AlertDescription>
              {errors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            disabled={files.length === 0 || isProcessing}
            onClick={handleImport}
          >
            {isProcessing ? (
              <>
                <Spinner />
                Analyse en cours...
              </>
            ) : (
              "Lancer l'OCR"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
