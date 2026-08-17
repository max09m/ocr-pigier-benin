import { config } from "dotenv"

config({ path: ".env" })
config({ path: ".env.local", override: true })

async function main() {
  const { auth } = await import("@/lib/auth")
  const { default: prisma } = await import("@/lib/prisma")

  try {
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD
    const name = process.env.SEED_ADMIN_NAME ?? "Admin"

    if (!email || !password) {
      throw new Error(
        "SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD doivent être définis (ex. dans .env.local) pour créer le compte admin initial."
      )
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email } })
    if (existingAdmin) {
      console.log(`Un compte existe déjà pour ${email}, rien à faire.`)
    } else {
      const { user } = await auth.api.createUser({
        body: { email, password, name, role: "admin" },
      })
      console.log(`Compte admin créé : ${user.email} (${user.id})`)
    }

    const templateNom = "Tractage 2026"
    const templateAnnee = 2026

    const existingTemplate = await prisma.template.findFirst({
      where: { nom: templateNom, annee: templateAnnee },
    })

    if (existingTemplate) {
      console.log(
        `Le template "${templateNom}" (${templateAnnee}) existe déjà, rien à faire.`
      )
    } else {
      const template = await prisma.template.create({
        data: {
          nom: templateNom,
          annee: templateAnnee,
          fields: {
            create: [
              {
                key: "nom_prenom",
                label: "Nom & Prénom",
                type: "text",
                requis: true,
                ordre: 1,
              },
              {
                key: "telephone",
                label: "Téléphone",
                type: "tel",
                requis: false,
                ordre: 2,
              },
            ],
          },
        },
      })
      console.log(`Template créé : ${template.nom} (${template.id})`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
