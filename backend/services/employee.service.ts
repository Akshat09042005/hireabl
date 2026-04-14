import { prisma } from '../utils/prisma'


/**
 * Creates a new employee record.
 * @param name - The full name of the employee.
 * @param userId - The ID of the user this employee record belongs to.
 */
export async function createEmployee(name: string, userId: string) {
  return await prisma.employee.create({
    data: {
      name,
      userId,
    },
  })
}
