/** Prisma include for test sections + ordered questions (reused across test queries). */
export const TEST_SECTIONS_INCLUDE = {
  orderBy: { orderIndex: 'asc' as const },
  include: {
    questions: { orderBy: { orderIndex: 'asc' as const } },
  },
} as const;
