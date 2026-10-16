/*
  Warnings:

  - You are about to alter the column `title` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(120)`.
  - You are about to alter the column `description` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(254)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.

*/
-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "title" SET DATA TYPE VARCHAR(120),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE VARCHAR(254),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(60);
