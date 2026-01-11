/*
  Warnings:

  - You are about to drop the column `tokem` on the `email_verifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token_hash]` on the table `email_verifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token_hash` to the `email_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "email_verifications_id_user_id_idx";

-- AlterTable
ALTER TABLE "email_verifications" DROP COLUMN "tokem",
ADD COLUMN     "token_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_hash_key" ON "email_verifications"("token_hash");

-- CreateIndex
CREATE INDEX "email_verifications_user_id_token_hash_idx" ON "email_verifications"("user_id", "token_hash");
