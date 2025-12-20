-- CreateTable
CREATE TABLE "rfc_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "connectionId" TEXT NOT NULL,
    "rfm_name" TEXT NOT NULL,
    "parameters" JSONB,
    "api_path" TEXT,
    "api_key" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfc_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfc_calls" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "rfm_name" TEXT NOT NULL,
    "parameters" JSONB,
    "result" JSONB,
    "duration" INTEGER NOT NULL,
    "status" "CallStatus" NOT NULL,
    "errorMessage" TEXT,
    "source" TEXT,
    "calledBy" TEXT,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfc_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rfc_templates_name_key" ON "rfc_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rfc_templates_api_path_key" ON "rfc_templates"("api_path");

-- CreateIndex
CREATE INDEX "rfc_templates_api_path_idx" ON "rfc_templates"("api_path");

-- CreateIndex
CREATE INDEX "rfc_templates_isActive_idx" ON "rfc_templates"("isActive");

-- CreateIndex
CREATE INDEX "rfc_calls_templateId_idx" ON "rfc_calls"("templateId");

-- CreateIndex
CREATE INDEX "rfc_calls_status_idx" ON "rfc_calls"("status");

-- CreateIndex
CREATE INDEX "rfc_calls_calledAt_idx" ON "rfc_calls"("calledAt");

-- AddForeignKey
ALTER TABLE "rfc_templates" ADD CONSTRAINT "rfc_templates_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "sap_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfc_calls" ADD CONSTRAINT "rfc_calls_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "rfc_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
