/*
  Warnings:

  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- DropTable
DROP TABLE "accounts";

-- CreateTable
CREATE TABLE "auth_providers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "provider_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_providers_provider_account_id_key" ON "auth_providers"("provider_account_id");

-- CreateIndex
CREATE INDEX "auth_providers_id_user_id_idx" ON "auth_providers"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_providers_provider_provider_account_id_key" ON "auth_providers"("provider", "provider_account_id");

-- AddForeignKey
ALTER TABLE "auth_providers" ADD CONSTRAINT "auth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
