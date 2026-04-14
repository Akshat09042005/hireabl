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

/**
 * Updates basic onboarding profile fields for an employee user.
 */
export async function updateEmployeeProfile(
  userId: string,
  country: string,
  qualification: string,
  companyName?: string,
  city?: string,
) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      country,
      qualification,
      companyName: companyName || null,
      city: city || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      city: true,
      qualification: true,
      companyName: true,
      profilePhoto: true,
      onboardingCompleted: true,
      role: true,
    },
  })
}
