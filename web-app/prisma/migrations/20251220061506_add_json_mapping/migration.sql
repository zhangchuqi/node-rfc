-- AlterTable
ALTER TABLE "rfc_templates" ADD COLUMN     "input_mapping" JSONB,
ADD COLUMN     "output_mapping" JSONB;
