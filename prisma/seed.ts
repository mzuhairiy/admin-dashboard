/**
 * Deterministic seed — same output on every run.
 *
 * - Fixed faker seed (12345), fixed "now" (FIXED_NOW = 2026-01-01T00:00:00Z).
 * - 5,000 transactions spread over the 365 days before FIXED_NOW with:
 *   weekend ~1.5x weekday volume, 3 spike days (~4x), ~5% month-over-month growth.
 * - Exact status distribution: 85% PAID, 5% PENDING, 7% REFUNDED, 3% CANCELLED.
 * - Log-normal amounts (median ~Rp 350.000, clamped to Rp 50.000 – Rp 5.000.000).
 * - Sequential externalId TX-2025-000001..TX-2025-005000 (ordered by createdAt).
 * - Idempotent: transactions are wiped and re-created; users/categories upserted.
 */
import { faker } from "@faker-js/faker";
import { PrismaClient, TransactionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIXED_NOW = new Date("2026-01-01T00:00:00Z");
const DAYS = 365;
const TOTAL_TRANSACTIONS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Spike days (event sales) — fixed dates within the seeded year.
const SPIKE_DAYS = ["2025-06-06", "2025-11-11", "2025-12-12"];
const SPIKE_MULTIPLIER = 4;
const WEEKEND_MULTIPLIER = 1.5;
const MONTHLY_GROWTH = 1.05;

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Food & Beverage",
  "Home & Living",
  "Health & Beauty",
  "Sports",
  "Books",
  "Toys",
  "Automotive",
  "Other",
];

const CITIES = ["Jakarta", "Surabaya", "Bandung", "Medan", "Singapore", "Tokyo"];

const USERS = [
  {
    email: "viewer@example.com",
    password: "Viewer123!",
    name: "Vera Viewer",
    role: UserRole.VIEWER,
  },
  {
    email: "manager@example.com",
    password: "Manager123!",
    name: "Maya Manager",
    role: UserRole.MANAGER,
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Start-of-day UTC for day index i (0 = oldest, DAYS-1 = day before FIXED_NOW). */
function dayStartUtc(i: number): Date {
  return new Date(FIXED_NOW.getTime() - (DAYS - i) * DAY_MS);
}

/** Relative volume weight for a day (growth trend * weekend * spike). */
function dayWeight(i: number): number {
  const date = dayStartUtc(i);
  const monthsFromStart =
    (date.getUTCFullYear() - dayStartUtc(0).getUTCFullYear()) * 12 +
    (date.getUTCMonth() - dayStartUtc(0).getUTCMonth());
  let weight = Math.pow(MONTHLY_GROWTH, monthsFromStart);
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) weight *= WEEKEND_MULTIPLIER;
  if (SPIKE_DAYS.includes(date.toISOString().slice(0, 10))) weight *= SPIKE_MULTIPLIER;
  return weight;
}

/** Distribute TOTAL_TRANSACTIONS across days proportionally (largest remainder). */
function transactionsPerDay(): number[] {
  const weights = Array.from({ length: DAYS }, (_, i) => dayWeight(i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / totalWeight) * TOTAL_TRANSACTIONS);
  const counts = raw.map(Math.floor);
  let remaining = TOTAL_TRANSACTIONS - counts.reduce((a, b) => a + b, 0);
  const byRemainder = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < remaining; k++) counts[byRemainder[k].i]++;
  return counts;
}

/** Log-normal amount in integer Rupiah (median ~350k), deterministic via seeded faker. */
function logNormalAmount(): number {
  // Box-Muller from two seeded uniforms
  const u1 = faker.number.float({ min: 1e-9, max: 1 });
  const u2 = faker.number.float({ min: 0, max: 1 });
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const mu = Math.log(350_000);
  const sigma = 0.85;
  const amount = Math.round(Math.exp(mu + sigma * z) / 1000) * 1000;
  return Math.min(5_000_000, Math.max(50_000, amount));
}

/** Exact status counts (85/5/7/3 of the total), deterministically shuffled. */
function statusSequence(): TransactionStatus[] {
  const statuses: TransactionStatus[] = [
    ...Array<TransactionStatus>(Math.round(TOTAL_TRANSACTIONS * 0.85)).fill(TransactionStatus.PAID),
    ...Array<TransactionStatus>(Math.round(TOTAL_TRANSACTIONS * 0.05)).fill(
      TransactionStatus.PENDING,
    ),
    ...Array<TransactionStatus>(Math.round(TOTAL_TRANSACTIONS * 0.07)).fill(
      TransactionStatus.REFUNDED,
    ),
    ...Array<TransactionStatus>(Math.round(TOTAL_TRANSACTIONS * 0.03)).fill(
      TransactionStatus.CANCELLED,
    ),
  ];
  return faker.helpers.shuffle(statuses);
}

async function main() {
  // Compose bootstraps fresh databases without resetting an existing QA dataset.
  if (process.argv.includes("--if-empty")) {
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.transaction.count(),
    ]);
    if (counts.some((count) => count > 0)) {
      console.log(
        "Seed skipped: database already contains data. Use db:seed explicitly to reset transactions.",
      );
      return;
    }
  }

  faker.seed(12345);

  // Users (upsert — password hash is salted, so keep existing on re-run)
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: {
        email: u.email,
        password: await bcrypt.hash(u.password, 10),
        name: u.name,
        role: u.role,
      },
    });
  }

  // Categories (upsert by unique name)
  const categoryIds: string[] = [];
  for (const name of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categoryIds.push(category.id);
  }

  // Transactions — wipe and re-create for a deterministic, duplicate-free state
  await prisma.transaction.deleteMany();

  const counts = transactionsPerDay();
  const statuses = statusSequence();

  type TxRow = {
    externalId: string;
    amount: number;
    customerName: string;
    customerCity: string;
    status: TransactionStatus;
    categoryId: string;
    createdAt: Date;
  };

  const rows: TxRow[] = [];
  let txIndex = 0;
  for (let day = 0; day < DAYS; day++) {
    const start = dayStartUtc(day).getTime();
    // Deterministic times within the day, sorted so externalId order == createdAt order
    const offsets = Array.from({ length: counts[day] }, () =>
      faker.number.int({ min: 0, max: DAY_MS - 1000 }),
    ).sort((a, b) => a - b);
    for (const offset of offsets) {
      txIndex++;
      rows.push({
        externalId: `TX-2025-${String(txIndex).padStart(6, "0")}`,
        amount: logNormalAmount(),
        customerName: faker.person.fullName(),
        customerCity: faker.helpers.arrayElement(CITIES),
        status: statuses[txIndex - 1],
        categoryId: faker.helpers.arrayElement(categoryIds),
        createdAt: new Date(start + offset),
      });
    }
  }

  for (let i = 0; i < rows.length; i += 500) {
    await prisma.transaction.createMany({ data: rows.slice(i, i + 500) });
  }

  const count = await prisma.transaction.count();
  console.log(
    `Seed complete: ${count} transactions, ${CATEGORIES.length} categories, ${USERS.length} users.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
