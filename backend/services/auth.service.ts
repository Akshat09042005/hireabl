import { prisma } from '../utils/prisma'


export async function createOrGetUser(phone: string) {
  return await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  })
}

export async function findOrCreateOAuthUser(data: {
  email: string | null
  name: string
  provider: string
  providerId: string
  role: string
}) {
  const { provider, providerId, email, name, role } = data
  const normalizedEmail = email?.trim().toLowerCase() || null
  console.log(`[auth.service] findOrCreateOAuthUser: ${provider} | ${normalizedEmail} | role: ${role}`)

  // 1. Find existing user by provider/id
  let user = await prisma.user.findUnique({
    where: {
      provider_providerId: { provider, providerId }
    },
    include: {
      employee: true,
      employer: true
    }
  })
  console.log(`[auth.service] Search by provider/id: ${user ? 'found' : 'not found'}`)

  // 2. If not found, check by email (optional, but good for linking)
  if (!user && normalizedEmail) {
    user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: true,
        employer: true
      }
    })

    // If found by email, link the provider
    if (user) {
      console.log(`[auth.service] Linking provider to existing email user: ${user.id}`)
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider, providerId },
        include: {
          employee: true,
          employer: true
        }
      })
    }
  }

  // Update role if explicitly requested a different role 
  if (user && role && user.role !== role) {
    console.log(`[auth.service] Updating role for user ${user.id} to ${role}`)
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role },
      include: {
        employee: true,
        employer: true
      }
    })
  }

  // 3. Create if still not found
  if (!user) {
    console.log(`[auth.service] Creating new user for role: ${role}`)
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        provider,
        providerId,
        role,
        // Automatically create associated model based on role
        ...(role === 'employer' 
          ? { employer: { create: { name } } }
          : { employee: { create: { name } } }
        )
      },
      include: {
        employee: true,
        employer: true
      }
    })
    console.log(`[auth.service] New user created: ${user.id}`)
  }

  return user
}
