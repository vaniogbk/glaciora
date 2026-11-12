-- Mentions légales (une seule ligne) : ajout de table uniquement, aucune donnée existante modifiée.
CREATE TABLE "LegalNotice" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "companyName" TEXT,
    "legalForm" TEXT,
    "shareCapital" TEXT,
    "registration" TEXT,
    "vatNumber" TEXT,
    "headOffice" TEXT,
    "publicationDirector" TEXT,
    "hostName" TEXT,
    "hostAddress" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalNotice_pkey" PRIMARY KEY ("id")
);
