import { prisma } from '../utils/prisma'

export async function updateEmployerOnboarding(
  userId: string,
  data: {
    designation: string
    roleInCompany: string
    companyName: string
    companyWebsite?: string
    industry: string
    companySize?: string
    country: string
    state: string
    city: string
    gstNumber: string
  }
) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      designation: true,
      roleInCompany: true,
      companyName: true,
      companyWebsite: true,
      industry: true,
      companySize: true,
      country: true,
      state: true,
      city: true,
      gstNumber: true,
      onboardingCompleted: true,
      role: true,
    },
  })
}
