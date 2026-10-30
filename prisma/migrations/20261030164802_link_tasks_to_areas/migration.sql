-- JV-1: link every task to an area WITHOUT losing existing tasks.
-- Edited by hand: Prisma's generated version added "areaId" as NOT NULL directly,
-- which fails on a table that already has rows.

-- 1. Add the column as optional first, so existing rows are allowed
ALTER TABLE "Task" ADD COLUMN "areaId" INTEGER;

-- 2. Create a "General" area for every user that already has tasks
--    (ON CONFLICT: if that user already has an area called "General", reuse it)
INSERT INTO "Area" ("name", "color", "position", "createdAt", "updatedAt", "userId")
SELECT DISTINCT 'General', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, "userId"
FROM "Task"
ON CONFLICT ("userId", "name") DO NOTHING;

-- 3. Move every task into its owner's "General" area
UPDATE "Task" AS t
SET "areaId" = a."id"
FROM "Area" AS a
WHERE a."userId" = t."userId"
  AND a."name" = 'General'
  AND t."areaId" IS NULL;

-- 4. Now that every task has an area, make the column required
ALTER TABLE "Task" ALTER COLUMN "areaId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Task_areaId_idx" ON "Task"("areaId");

-- AddForeignKey (RESTRICT: an area that still has tasks can't be deleted)
ALTER TABLE "Task" ADD CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
