import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { UsersIcon } from "lucide-react"
import { CreateUserDialog } from "./create-user-dialog"
import { UserRoleSelect } from "./user-role-select"
import { UserBanToggle } from "./user-ban-toggle"

export default async function UtilisateursPage() {
  const currentSession = await requireAdmin()
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            Comptes admin et agents — créés manuellement, pas d&apos;auto-inscription.
          </p>
        </div>
        {users.length > 0 && <CreateUserDialog />}
      </div>

      {users.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>Aucun utilisateur</EmptyTitle>
            <EmptyDescription>
              Crée le premier compte pour commencer.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateUserDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentSession.user.id
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (toi)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <UserRoleSelect
                      userId={user.id}
                      role={user.role}
                      disabled={isCurrentUser}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.banned ? "destructive" : "outline"}>
                      {user.banned ? "Banni" : "Actif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserBanToggle
                      userId={user.id}
                      banned={!!user.banned}
                      disabled={isCurrentUser}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
