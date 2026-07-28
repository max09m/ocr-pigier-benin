-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('text', 'tel', 'email', 'number', 'date', 'select');

-- CreateEnum
CREATE TYPE "TractageSource" AS ENUM ('ocr', 'tablette');

-- CreateEnum
CREATE TYPE "TractageStatut" AS ENUM ('en_cours', 'valide', 'exporte');

-- CreateEnum
CREATE TYPE "EntryStatut" AS ENUM ('a_verifier', 'valide');

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- CreateTable
CREATE TABLE "template" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "requis" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "ordre" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tractage_session" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "templateId" UUID NOT NULL,
    "etablissement" TEXT NOT NULL,
    "dateTractage" DATE NOT NULL,
    "source" "TractageSource" NOT NULL,
    "statut" "TractageStatut" NOT NULL DEFAULT 'en_cours',
    "fichierUrl" TEXT,
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tractage_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "ligne" INTEGER NOT NULL,
    "valeurs" JSONB NOT NULL DEFAULT '{}',
    "confiance" JSONB,
    "statut" "EntryStatut" NOT NULL DEFAULT 'a_verifier',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "field_templateId_key_key" ON "field"("templateId", "key");

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field" ADD CONSTRAINT "field_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tractage_session" ADD CONSTRAINT "tractage_session_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tractage_session" ADD CONSTRAINT "tractage_session_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry" ADD CONSTRAINT "entry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tractage_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
