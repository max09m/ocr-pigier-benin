import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { toast } from "sonner"

export const authClient = createAuthClient({
  plugins: [adminClient()],
})

export const signInAction = async (email: string, password: string) => {
  await authClient.signIn.email({
    email,
    password,
    callbackURL: "/admin/dashboard",
    fetchOptions: {
      onSuccess: () => {
        toast.success("Connexion réussie, redirection...")
      },
      onError: (error) => {
        toast.error(error.error.message)
      },
    },
  })
}

export const signOutAction = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/sign-in"
      },
      onError: (error) => {
        toast.error(error.error.message)
      },
    },
  })
}