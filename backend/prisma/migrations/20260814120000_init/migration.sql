-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "daily_calorie_target" INTEGER NOT NULL,
    "protein_grams" DECIMAL(8,2) NOT NULL,
    "carbs_grams" DECIMAL(8,2) NOT NULL,
    "fat_grams" DECIMAL(8,2) NOT NULL,
    "weight_goal_kg" DECIMAL(6,2) NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "food_name" TEXT NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "serving_unit" TEXT NOT NULL,
    "calories" DECIMAL(8,2) NOT NULL,
    "protein_grams" DECIMAL(8,2) NOT NULL,
    "carbs_grams" DECIMAL(8,2) NOT NULL,
    "fat_grams" DECIMAL(8,2) NOT NULL,
    "vitamin_c_mg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "calcium_mg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "iron_mg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "vitamin_d_iu" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "potassium_mg" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "goals_user_id_effective_from_idx" ON "goals"("user_id", "effective_from");

-- CreateIndex
CREATE INDEX "food_entries_user_id_consumed_at_idx" ON "food_entries"("user_id", "consumed_at");

-- CreateIndex
CREATE INDEX "food_entries_user_id_meal_type_consumed_at_idx" ON "food_entries"("user_id", "meal_type", "consumed_at");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
