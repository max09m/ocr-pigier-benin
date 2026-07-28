import { requireAuth } from "@/lib/session"

export default async function Page() {
  await requireAuth()

  return <div>Interface Agent </div>
}