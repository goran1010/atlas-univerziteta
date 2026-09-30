-- Create BetterAuth tables

CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "role" NOT NULL DEFAULT 'USER',
    "adminRequestedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing users from the old "users" table

INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt", "role", "adminRequestedAt")
SELECT
    "id",
    split_part("email", '@', 1),
    "email",
    true,
    NOW(),
    NOW(),
    "role",
    "adminRequestedAt"
FROM "users";

-- Migrate email/password credentials into the account table

INSERT INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    'credential',
    "id",
    "password",
    NOW(),
    NOW()
FROM "users"
WHERE "password" IS NOT NULL;

-- Migrate GitHub OAuth links into the account table

INSERT INTO "account" ("id", "accountId", "providerId", "userId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "githubId",
    'github',
    "id",
    NOW(),
    NOW()
FROM "users"
WHERE "githubId" IS NOT NULL;

-- Migrate Google OAuth links into the account table

INSERT INTO "account" ("id", "accountId", "providerId", "userId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "googleId",
    'google',
    "id",
    NOW(),
    NOW()
FROM "users"
WHERE "googleId" IS NOT NULL;

-- Update PendingChange foreign key to point to the new user table

ALTER TABLE "pending_changes" DROP CONSTRAINT "pending_changes_userId_fkey";
ALTER TABLE "pending_changes" ADD CONSTRAINT "pending_changes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old tables

DROP TABLE "sessions";
DROP TABLE "users";
