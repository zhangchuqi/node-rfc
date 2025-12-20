-- AlterTable
ALTER TABLE "rfc_templates" ADD COLUMN     "input_schema" JSONB,
ADD COLUMN     "output_schema" JSONB;
