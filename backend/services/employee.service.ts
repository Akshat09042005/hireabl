import { prisma } from '../utils/prisma'

/**
 * Creates a new employee record.
 */
export async function createEmployee(name: string, userId: string) {
  return await prisma.employee.create({
    data: { name, userId },
  })
}

/**
 * Updates basic onboarding profile fields for an employee user (Step 1).
 */
export async function updateEmployeeProfile(
  userId: string,
  country: string,
  state: string,
  city: string,
) {
  return await prisma.user.update({
    where: { id: userId },
    data: { country, state, city },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      country: true,
      state: true,
      city: true,
      qualification: true,
      companyName: true,
      designation: true,
      skills: true,
      yearsOfExperience: true,
      workEmail: true,
      profilePhoto: true,
      onboardingCompleted: true,
      role: true,
    },
  })
}

/**
 * Updates professional details for an employee user (Step 2).
 */
export async function updateEmployeeProfessional(
  userId: string,
  data: {
    qualification: string
    companyName: string
    designation: string
    skills: string[]
    yearsOfExperience?: number
    workEmail?: string
  },
) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      qualification: data.qualification,
      companyName: data.companyName,
      designation: data.designation,
      skills: data.skills,
      ...(data.yearsOfExperience !== undefined && { yearsOfExperience: data.yearsOfExperience }),
      ...(data.workEmail && { workEmail: data.workEmail }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      qualification: true,
      companyName: true,
      designation: true,
      skills: true,
      yearsOfExperience: true,
      workEmail: true,
      role: true,
    },
  })
}