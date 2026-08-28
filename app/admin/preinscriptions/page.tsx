import { SessionList } from "@/app/_sessions/session-list"

export default function AdminPreinscriptionsPage() {
  return (
    <SessionList
      basePath="/admin/preinscriptions"
      templateNom="Fiche préinscription"
      title="Fiches de préinscription"
      description="Une fiche correspond à un registre de préinscription rempli pour une date donnée."
      emptyDescription="Crée une fiche pour commencer à collecter des préinscriptions."
      createDialogTitle="Nouvelle fiche de préinscription"
    />
  )
}
