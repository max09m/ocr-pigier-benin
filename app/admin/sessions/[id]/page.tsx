import { SessionDetail } from "@/app/_sessions/session-detail"

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SessionDetail basePath="/admin/sessions" id={id} />
}
