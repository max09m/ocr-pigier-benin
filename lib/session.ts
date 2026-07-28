import "server-only"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
})

export const requireAuth = cache(async () => {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/sign-in")
  }

  return session
})

export const requireAdmin = cache(async () => {
  const session = await requireAuth()

  if (session.user.role !== "admin") {
    redirect("/agents/dashboard")
  }

  return session
})
