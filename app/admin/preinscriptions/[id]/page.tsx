import { SessionDetail } from "@/app/_sessions/session-detail"

export default async function AdminPreinscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <SessionDetail
      basePath="/admin/preinscriptions"
      id={id}
      backLabel="Fiches de préinscription"
    />
  )
}
