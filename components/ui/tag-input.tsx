"use client"

import { useState, type KeyboardEvent } from "react"
import { XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  function commitDraft() {
    const tag = draft.trim()
    setDraft("")
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      commitDraft()
      return
    }
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag))
  }

  return (
    <div
      className={cn(
        "flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-none border border-input bg-transparent px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50"
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="hover:text-destructive"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-24 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
