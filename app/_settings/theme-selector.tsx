"use client"

import { useTheme } from "next-themes"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">Thème</h2>
      <ToggleGroup
        value={theme ? [theme] : []}
        onValueChange={(value) => {
          const next = value[0]
          if (next) setTheme(next)
        }}
        variant="outline"
      >
        <ToggleGroupItem value="light" aria-label="Clair">
          <SunIcon />
          Clair
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" aria-label="Sombre">
          <MoonIcon />
          Sombre
        </ToggleGroupItem>
        <ToggleGroupItem value="system" aria-label="Système">
          <MonitorIcon />
          Système
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
