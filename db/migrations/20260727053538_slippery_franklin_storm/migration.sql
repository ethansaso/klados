ALTER TABLE "account" RENAME COLUMN "account_id" TO "provider_account_id";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "account" SET "issuer" = CASE WHEN "provider_id" = 'credential' THEN 'local:' || "provider_id" ELSE 'local:oauth:' || "provider_id" END WHERE "issuer" IS NULL;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;