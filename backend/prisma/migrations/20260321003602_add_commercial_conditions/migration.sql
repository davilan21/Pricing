-- CreateTable
CREATE TABLE "commercial_conditions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessLine" "BusinessLine" NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commercial_conditions_userId_businessLine_key" ON "commercial_conditions"("userId", "businessLine");

-- AddForeignKey
ALTER TABLE "commercial_conditions" ADD CONSTRAINT "commercial_conditions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
