import { requireAuth } from "@/lib/session"
import { ProfileForm } from "./profile-form"
import { PasswordForm } from "./password-form"
import { ThemeSelector } from "./theme-selector"

export async function SettingsView() {
  const session = await requireAuth()

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Ton profil et tes préférences.
        </p>
      </div>

      <ProfileForm name={session.user.name} email={session.user.email} />
      <PasswordForm />
      <ThemeSelector />
    </div>
  )
}
