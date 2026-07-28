"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { SearchCommand } from "@/components/search-command"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Settings2Icon } from "lucide-react"
import type { NavItem } from "@/lib/nav-items"
import Image from "next/image"

export function AppSidebar({
  navMain,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  navMain: NavItem[]
  user: { name: string; email: string; avatar?: string | null }
}) {
  const pathname = usePathname()
  const basePath = pathname.startsWith("/admin") ? "/admin" : "/agents"

  const navSecondary: NavItem[] = [
    {
      title: "Paramètres",
      url: `${basePath}/parametres`,
      icon: <Settings2Icon />,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <Image
                src="/images/logo-admin.png" 
                alt="logo"
                width={32}
                height={32}
                className="size-5!" 
              />
              <span className="text-base font-semibold">Pigier Bénin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto">
          <SearchCommand />
        </NavSecondary>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
