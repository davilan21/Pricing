-- Step 1: Create business_lines table
CREATE TABLE "business_lines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_lines_name_key" ON "business_lines"("name");

-- Step 2: Insert default business lines with deterministic UUIDs
INSERT INTO "business_lines" ("id", "name", "isActive", "updatedAt") VALUES
    ('bl-equipo-dedicado', 'Equipo Dedicado', true, CURRENT_TIMESTAMP),
    ('bl-descubrimiento', 'Descubrimiento', true, CURRENT_TIMESTAMP),
    ('bl-sprint-mvp', 'Sprint MVP', true, CURRENT_TIMESTAMP),
    ('bl-caso-express', 'Caso Express', true, CURRENT_TIMESTAMP);

-- Step 3: Add businessLineId column to quotes (nullable first)
ALTER TABLE "quotes" ADD COLUMN "businessLineId" TEXT;

-- Step 4: Populate businessLineId from old enum column
UPDATE "quotes" SET "businessLineId" = CASE
    WHEN "businessLine" = 'EQUIPO_DEDICADO' THEN 'bl-equipo-dedicado'
    WHEN "businessLine" = 'DESCUBRIMIENTO' THEN 'bl-descubrimiento'
    WHEN "businessLine" = 'SPRINT_MVP' THEN 'bl-sprint-mvp'
    WHEN "businessLine" = 'CASO_EXPRESS' THEN 'bl-caso-express'
END;

-- Step 5: Make businessLineId NOT NULL and add FK
ALTER TABLE "quotes" ALTER COLUMN "businessLineId" SET NOT NULL;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_businessLineId_fkey" FOREIGN KEY ("businessLineId") REFERENCES "business_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: Drop old businessLine enum column from quotes
ALTER TABLE "quotes" DROP COLUMN "businessLine";

-- Step 7: Handle commercial_conditions - add businessLineId
ALTER TABLE "commercial_conditions" ADD COLUMN "businessLineId" TEXT;

-- Step 8: Populate businessLineId from old enum column
UPDATE "commercial_conditions" SET "businessLineId" = CASE
    WHEN "businessLine" = 'EQUIPO_DEDICADO' THEN 'bl-equipo-dedicado'
    WHEN "businessLine" = 'DESCUBRIMIENTO' THEN 'bl-descubrimiento'
    WHEN "businessLine" = 'SPRINT_MVP' THEN 'bl-sprint-mvp'
    WHEN "businessLine" = 'CASO_EXPRESS' THEN 'bl-caso-express'
END;

-- Step 9: Drop old unique constraint and column
ALTER TABLE "commercial_conditions" DROP CONSTRAINT IF EXISTS "commercial_conditions_userId_businessLine_key";
ALTER TABLE "commercial_conditions" DROP COLUMN "businessLine";

-- Step 10: Make businessLineId NOT NULL and add FK + unique constraint
ALTER TABLE "commercial_conditions" ALTER COLUMN "businessLineId" SET NOT NULL;
ALTER TABLE "commercial_conditions" ADD CONSTRAINT "commercial_conditions_businessLineId_fkey" FOREIGN KEY ("businessLineId") REFERENCES "business_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "commercial_conditions_userId_businessLineId_key" ON "commercial_conditions"("userId", "businessLineId");

-- Step 11: Drop the old BusinessLine enum type
DROP TYPE IF EXISTS "BusinessLine";
