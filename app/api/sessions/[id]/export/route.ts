import ExcelJS from "exceljs"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { formatPhoneDisplay } from "@/lib/format"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth()

  const { id } = await params

  const tractageSession = await prisma.tractageSession.findUnique({
    where: { id, deletedAt: null },
    include: {
      template: {
        include: {
          fields: { where: { actif: true }, orderBy: { ordre: "asc" } },
        },
      },
      entries: { orderBy: { ligne: "asc" } },
    },
  })

  if (!tractageSession) {
    return Response.json({ error: "Session introuvable" }, { status: 404 })
  }

  const fields = tractageSession.template.fields

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(
    tractageSession.etablissement.slice(0, 31) || "Tractage"
  )

  sheet.addRow([`Établissement : ${tractageSession.etablissement}`])
  sheet.addRow([
    `Date : ${tractageSession.dateTractage.toLocaleDateString("fr-FR")}`,
  ])
  sheet.addRow([])

  const headerRow = sheet.addRow(["N°", ...fields.map((field) => field.label)])
  headerRow.font = { bold: true }

  for (const entry of tractageSession.entries) {
    const valeurs = (entry.valeurs ?? {}) as Record<string, unknown>
    sheet.addRow([
      entry.ligne,
      ...fields.map((field) => {
        const value = valeurs[field.key]
        if (value == null || value === "") return ""
        return field.type === "tel" ? formatPhoneDisplay(String(value)) : value
      }),
    ])
  }

  sheet.columns.forEach((column) => {
    column.width = 22
  })

  await prisma.tractageSession.update({
    where: { id },
    data: { statut: "exporte" },
  })

  revalidatePath("/admin/sessions")
  revalidatePath("/agents/sessions")
  revalidatePath(`/admin/sessions/${id}`)
  revalidatePath(`/agents/sessions/${id}`)

  const buffer = await workbook.xlsx.writeBuffer()

  const filename = `tractage_${tractageSession.etablissement.replace(/[^a-z0-9]+/gi, "-")}_${tractageSession.dateTractage.toISOString().slice(0, 10)}.xlsx`

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
