-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "appliedRole" TEXT NOT NULL DEFAULT 'OTHERS',
ADD COLUMN     "originalPrice" DECIMAL(65,30) NOT NULL DEFAULT 0;
