"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { SearchIcon } from "lucide-react"
import { searchEntities, type SearchResults } from "@/lib/search-actions"

const EMPTY_RESULTS: SearchResults = { sessions: [], templates: [], users: [] }

export function SearchCommand() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS)
  const [isPending, startTransition] = useTransition()

  const basePath = pathname.startsWith("/admin") ? "/admin" : "/agents"

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const trimmedQuery = query.trim()

  useEffect(() => {
    if (trimmedQuery.length < 2) {
      return
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchEntities(trimmedQuery))
      })
    }, 250)

    return () => clearTimeout(timeout)
  }, [trimmedQuery])

  const visibleResults = trimmedQuery.length < 2 ? EMPTY_RESULTS : results

  function go(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setOpen(true)}>
          <SearchIcon />
          <span>Rechercher</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Rechercher"
        description="Rechercher une session, un template ou un utilisateur"
      >
        <CommandInput
          placeholder="Rechercher une session, un template..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {trimmedQuery.length < 2
              ? "Tape au moins 2 caractères"
              : isPending
                ? "Recherche..."
                : "Aucun résultat"}
          </CommandEmpty>

          {visibleResults.sessions.length > 0 && (
            <CommandGroup heading="Sessions">
              {visibleResults.sessions.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => go(`${basePath}/sessions/${item.id}`)}
                >
                  {item.etablissement} —{" "}
                  {item.dateTractage.toLocaleDateString("fr-FR")}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {visibleResults.templates.length > 0 && (
            <CommandGroup heading="Templates">
              {visibleResults.templates.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => go(`/admin/templates/${item.id}`)}
                >
                  {item.nom} ({item.annee})
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {visibleResults.users.length > 0 && (
            <CommandGroup heading="Utilisateurs">
              {visibleResults.users.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => go("/admin/utilisateurs")}
                >
                  {item.name} — {item.email}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
