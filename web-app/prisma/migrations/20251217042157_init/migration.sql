-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('CLIENT', 'POOL');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT', 'CANCELLED');

-- CreateTable
CREATE TABLE "sap_connections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connectionType" "ConnectionType" NOT NULL,
    "ashost" TEXT NOT NULL,
    "sysnr" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'EN',
    "saprouter" TEXT,
    "snc_mode" TEXT,
    "snc_qop" TEXT,
    "snc_myname" TEXT,
    "snc_partnername" TEXT,
    "trace" TEXT,
    "poolOptions" JSONB,
    "clientOptions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sap_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "rfm_name" TEXT NOT NULL,
    "parameters" JSONB,
    "result" JSONB,
    "duration" INTEGER NOT NULL,
    "status" "CallStatus" NOT NULL,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "errorKey" TEXT,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sap_connections_name_key" ON "sap_connections"("name");

-- CreateIndex
CREATE INDEX "sap_connections_connectionType_idx" ON "sap_connections"("connectionType");

-- CreateIndex
CREATE INDEX "sap_connections_isActive_idx" ON "sap_connections"("isActive");

-- CreateIndex
CREATE INDEX "call_logs_connectionId_idx" ON "call_logs"("connectionId");

-- CreateIndex
CREATE INDEX "call_logs_status_idx" ON "call_logs"("status");

-- CreateIndex
CREATE INDEX "call_logs_calledAt_idx" ON "call_logs"("calledAt");

-- CreateIndex
CREATE INDEX "call_logs_rfm_name_idx" ON "call_logs"("rfm_name");

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "sap_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
