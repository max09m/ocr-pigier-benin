import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  ScanTextIcon,
  LayoutTemplateIcon,
  UsersIcon,
  UserPlusIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Tableau de bord",
    url: "/admin/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Sessions de tractage",
    url: "/admin/sessions",
    icon: <ClipboardListIcon />,
  },
  {
    title: "Vérification OCR",
    url: "/admin/verification",
    icon: <ScanTextIcon />,
  },
  {
    title: "Fiche préinscription",
    url: "/admin/preinscriptions",
    icon: <UserPlusIcon />,
  },
  {
    title: "Templates",
    url: "/admin/templates",
    icon: <LayoutTemplateIcon />,
  },
  {
    title: "Utilisateurs",
    url: "/admin/utilisateurs",
    icon: <UsersIcon />,
  },
]

export const AGENT_NAV_ITEMS: NavItem[] = [
  {
    title: "Sessions de tractage",
    url: "/agents/sessions",
    icon: <ClipboardListIcon />,
  },
]
