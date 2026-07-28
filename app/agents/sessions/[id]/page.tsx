import { SessionDetail } from "@/app/_sessions/session-detail"

export default async function AgentSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SessionDetail basePath="/agents/sessions" id={id} />
}
