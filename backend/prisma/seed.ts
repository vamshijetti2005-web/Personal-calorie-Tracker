import { PrismaClient, type MealType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

type SeedMeal = {
  mealType: MealType;
  foodName: string;
  quantity: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  vitaminCMg: number;
  calciumMg: number;
  ironMg: number;
  vitaminDIU: number;
  potassiumMg: number;
  hour: number;
};

const ROTATING_DAYS: SeedMeal[][] = [
  [
    { mealType: "BREAKFAST", foodName: "Greek yogurt with berries", quantity: 1, servingUnit: "bowl", calories: 280, proteinGrams: 22, carbsGrams: 32, fatGrams: 6, vitaminCMg: 28, calciumMg: 220, ironMg: 0.4, vitaminDIU: 40, potassiumMg: 380, hour: 8 },
    { mealType: "LUNCH", foodName: "Grilled chicken quinoa bowl", quantity: 1, servingUnit: "bowl", calories: 620, proteinGrams: 42, carbsGrams: 58, fatGrams: 22, vitaminCMg: 35, calciumMg: 80, ironMg: 3.2, vitaminDIU: 12, potassiumMg: 720, hour: 13 },
    { mealType: "DINNER", foodName: "Salmon, rice, and broccoli", quantity: 1, servingUnit: "plate", calories: 710, proteinGrams: 38, carbsGrams: 54, fatGrams: 32, vitaminCMg: 82, calciumMg: 90, ironMg: 1.8, vitaminDIU: 570, potassiumMg: 980, hour: 19 },
    { mealType: "SNACKS", foodName: "Apple and almond butter", quantity: 1, servingUnit: "serving", calories: 210, proteinGrams: 5, carbsGrams: 24, fatGrams: 12, vitaminCMg: 8, calciumMg: 40, ironMg: 0.6, vitaminDIU: 0, potassiumMg: 220, hour: 16 },
  ],
  [
    { mealType: "BREAKFAST", foodName: "Oatmeal with banana", quantity: 1, servingUnit: "bowl", calories: 340, proteinGrams: 10, carbsGrams: 62, fatGrams: 7, vitaminCMg: 9, calciumMg: 150, ironMg: 2.1, vitaminDIU: 0, potassiumMg: 540, hour: 8 },
    { mealType: "LUNCH", foodName: "Turkey avocado wrap", quantity: 1, servingUnit: "wrap", calories: 540, proteinGrams: 28, carbsGrams: 46, fatGrams: 26, vitaminCMg: 12, calciumMg: 70, ironMg: 2.4, vitaminDIU: 8, potassiumMg: 610, hour: 12 },
    { mealType: "DINNER", foodName: "Lentil curry with rice", quantity: 1, servingUnit: "plate", calories: 680, proteinGrams: 24, carbsGrams: 92, fatGrams: 18, vitaminCMg: 18, calciumMg: 60, ironMg: 6.4, vitaminDIU: 0, potassiumMg: 870, hour: 19 },
    { mealType: "SNACKS", foodName: "Cottage cheese", quantity: 150, servingUnit: "g", calories: 160, proteinGrams: 18, carbsGrams: 6, fatGrams: 6, vitaminCMg: 0, calciumMg: 180, ironMg: 0.1, vitaminDIU: 4, potassiumMg: 160, hour: 21 },
  ],
  [
    { mealType: "BREAKFAST", foodName: "Veggie omelette and toast", quantity: 1, servingUnit: "plate", calories: 410, proteinGrams: 26, carbsGrams: 28, fatGrams: 22, vitaminCMg: 22, calciumMg: 140, ironMg: 2.8, vitaminDIU: 44, potassiumMg: 310, hour: 8 },
    { mealType: "LUNCH", foodName: "Tuna poke bowl", quantity: 1, servingUnit: "bowl", calories: 590, proteinGrams: 36, carbsGrams: 52, fatGrams: 24, vitaminCMg: 16, calciumMg: 50, ironMg: 2.2, vitaminDIU: 80, potassiumMg: 690, hour: 13 },
    { mealType: "DINNER", foodName: "Turkey meatballs and pasta", quantity: 1, servingUnit: "plate", calories: 740, proteinGrams: 40, carbsGrams: 78, fatGrams: 26, vitaminCMg: 14, calciumMg: 110, ironMg: 3.6, vitaminDIU: 10, potassiumMg: 640, hour: 19 },
  ],
  [
    { mealType: "BREAKFAST", foodName: "Protein smoothie", quantity: 400, servingUnit: "ml", calories: 320, proteinGrams: 28, carbsGrams: 36, fatGrams: 8, vitaminCMg: 48, calciumMg: 260, ironMg: 1.1, vitaminDIU: 80, potassiumMg: 720, hour: 8 },
    { mealType: "LUNCH", foodName: "Chickpea salad", quantity: 1, servingUnit: "bowl", calories: 480, proteinGrams: 18, carbsGrams: 52, fatGrams: 20, vitaminCMg: 40, calciumMg: 90, ironMg: 4.1, vitaminDIU: 0, potassiumMg: 580, hour: 13 },
    { mealType: "DINNER", foodName: "Steak, sweet potato, greens", quantity: 1, servingUnit: "plate", calories: 780, proteinGrams: 46, carbsGrams: 48, fatGrams: 38, vitaminCMg: 30, calciumMg: 80, ironMg: 5.2, vitaminDIU: 8, potassiumMg: 1100, hour: 19 },
    { mealType: "SNACKS", foodName: "Dark chocolate", quantity: 20, servingUnit: "g", calories: 110, proteinGrams: 1, carbsGrams: 10, fatGrams: 8, vitaminCMg: 0, calciumMg: 12, ironMg: 1.2, vitaminDIU: 0, potassiumMg: 80, hour: 21 },
  ],
];

async function main() {
  const email = "demo@nourish.local";
  const passwordHash = await bcrypt.hash("DemoPass123!", 12);

  await prisma.foodEntry.deleteMany({ where: { user: { email } } });
  await prisma.goal.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: "Demo User",
    },
  });

  const now = new Date();
  const olderEffective = new Date(now);
  olderEffective.setUTCDate(olderEffective.getUTCDate() - 16);
  olderEffective.setUTCHours(0, 0, 0, 0);

  const newerEffective = new Date(now);
  newerEffective.setUTCDate(newerEffective.getUTCDate() - 7);
  newerEffective.setUTCHours(0, 0, 0, 0);

  await prisma.goal.createMany({
    data: [
      {
        userId: user.id,
        dailyCalorieTarget: 2300,
        proteinGrams: 140,
        carbsGrams: 250,
        fatGrams: 75,
        weightGoalKg: 72,
        effectiveFrom: olderEffective,
      },
      {
        userId: user.id,
        dailyCalorieTarget: 2100,
        proteinGrams: 150,
        carbsGrams: 210,
        fatGrams: 70,
        weightGoalKg: 70,
        effectiveFrom: newerEffective,
      },
    ],
  });

  const entries = [];
  for (let dayOffset = 13; dayOffset >= 0; dayOffset -= 1) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOffset));
    const meals = ROTATING_DAYS[dayOffset % ROTATING_DAYS.length];
    for (const meal of meals) {
      const consumedAt = new Date(day);
      consumedAt.setUTCHours(meal.hour, 0, 0, 0);
      entries.push({
        userId: user.id,
        mealType: meal.mealType,
        foodName: meal.foodName,
        quantity: meal.quantity,
        servingUnit: meal.servingUnit,
        calories: meal.calories,
        proteinGrams: meal.proteinGrams,
        carbsGrams: meal.carbsGrams,
        fatGrams: meal.fatGrams,
        vitaminCMg: meal.vitaminCMg,
        calciumMg: meal.calciumMg,
        ironMg: meal.ironMg,
        vitaminDIU: meal.vitaminDIU,
        potassiumMg: meal.potassiumMg,
        consumedAt,
      });
    }
  }

  await prisma.foodEntry.createMany({ data: entries });
  console.log(`Seeded ${email} with ${entries.length} entries and 2 goal versions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
