ALTER TABLE "account" RENAME COLUMN "provider_account_id" TO "account_id";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "issuer";