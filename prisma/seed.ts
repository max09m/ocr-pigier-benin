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
        data: { nom: templateNom, annee: templateAnnee },
      })
      // Champs créés un par un (et non via un `create` imbriqué avec des
      // types d'enum mélangés) : un `create` imbriqué avec plusieurs types
      // de champ différents dans le même batch a déjà silencieusement
      // enregistré "text" pour tous les champs au lieu du type demandé.
      await prisma.field.create({
        data: {
          templateId: template.id,
          key: "nom_prenom",
          label: "Nom & Prénom",
          type: "text",
          requis: true,
          ordre: 1,
        },
      })
      await prisma.field.create({
        data: {
          templateId: template.id,
          key: "telephone",
          label: "Téléphone",
          type: "tel",
          requis: false,
          ordre: 2,
        },
      })
      await prisma.field.create({
        data: {
          templateId: template.id,
          key: "telephone_2",
          label: "Téléphone 2",
          type: "tel",
          requis: false,
          ordre: 3,
        },
      })
      console.log(`Template créé : ${template.nom} (${template.id})`)
    }

    const preinscriptionNom = "Fiche préinscription"
    const preinscriptionAnnee = 2026

    const existingPreinscription = await prisma.template.findFirst({
      where: { nom: preinscriptionNom, annee: preinscriptionAnnee },
    })

    if (existingPreinscription) {
      console.log(
        `Le template "${preinscriptionNom}" (${preinscriptionAnnee}) existe déjà, rien à faire.`
      )
    } else {
      const preinscription = await prisma.template.create({
        data: { nom: preinscriptionNom, annee: preinscriptionAnnee },
      })

      const preinscriptionFields: {
        key: string
        label: string
        type: "text" | "tel" | "email" | "date"
        requis: boolean
        ordre: number
      }[] = [
        { key: "date", label: "Date", type: "date", requis: false, ordre: 1 },
        {
          key: "nom_prenom",
          label: "Nom & Prénoms",
          type: "text",
          requis: true,
          ordre: 2,
        },
        {
          key: "contact",
          label: "Contact",
          type: "tel",
          requis: false,
          ordre: 3,
        },
        {
          key: "email",
          label: "E-mail",
          type: "email",
          requis: false,
          ordre: 4,
        },
        {
          key: "classe",
          label: "Classe",
          type: "text",
          requis: false,
          ordre: 5,
        },
        {
          key: "niveau_dernier_diplome",
          label: "Niveau Dernier Diplôme",
          type: "text",
          requis: false,
          ordre: 6,
        },
        {
          key: "etablissement_origine",
          label: "Établissement d'origine",
          type: "text",
          requis: false,
          ordre: 7,
        },
        {
          key: "canal_connaissance",
          label: "Comment avez-vous connu Pigier Bénin",
          type: "text",
          requis: false,
          ordre: 8,
        },
      ]

      for (const field of preinscriptionFields) {
        await prisma.field.create({
          data: { templateId: preinscription.id, ...field },
        })
      }

      console.log(
        `Template créé : ${preinscription.nom} (${preinscription.id})`
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
