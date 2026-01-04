/*
  Warnings:

  - You are about to drop the column `revoked_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token_hash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "refresh_tokens_id_user_id_idx";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "email_verifications" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "revoked_at",
ADD COLUMN     "is_revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revoked_date" TIMESTAMPTZ,
ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_token_hash_is_revoked_idx" ON "refresh_tokens"("user_id", "token_hash", "is_revoked");

-- CreateIndex
CREATE INDEX "users_id_email_idx" ON "users"("id", "email");
