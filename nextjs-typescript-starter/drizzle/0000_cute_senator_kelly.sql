CREATE TABLE IF NOT EXISTS "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"cover_url" text,
	"book_id" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_book_id_unique" UNIQUE("book_id")
);
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"userEmail" varchar(64) NOT NULL,
	"bookId" text NOT NULL,
	"lastWordRank" integer,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_progress_user_email_book_id_unique" UNIQUE("userEmail","bookId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(64),
	"password" varchar(64)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "words" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"wordRank" integer,
	"headWord" text,
	"content" json,
	"bookId" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "study_progress_updated_at_idx" ON "study_progress" ("updatedAt");