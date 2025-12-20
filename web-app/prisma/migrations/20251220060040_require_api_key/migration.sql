/*
  Warnings:

  - You are about to drop the column `isPublic` on the `rfc_templates` table. All the data in the column will be lost.
  - Made the column `api_key` on table `rfc_templates` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "rfc_templates" DROP COLUMN "isPublic",
ALTER COLUMN "api_key" SET NOT NULL;
