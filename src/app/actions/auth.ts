'use server'

import { cookies } from 'next/headers'
import bcryptjs from 'bcryptjs'
import { getPrisma } from '@/lib/db'
import { loginSchema, registerSchema } from '@/lib/validators'
import { generateToken, verifyToken, setTokenCookie } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Role, User } from '@prisma/client'

type UserSession = Pick<User, 'id' | 'email' | 'name' | 'role'>

type AuthResponse =
  | { success: true; user: UserSession }
  | { success: false; error: string; details?: unknown }

export async function loginAction(
  email: string,
  password: string
): Promise<AuthResponse> {
  const validated = loginSchema.safeParse({ email, password })

  if (!validated.success) {
    return { success: false, error: 'Invalid input', details: validated.error.errors }
  }

  try {
    const prisma = await getPrisma()
    const user = await prisma.user.findUnique({
      where: { email: validated.data.email }
    })

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    const isPasswordValid = await bcryptjs.compare(
      validated.data.password,
      user.password
    )

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    await setTokenCookie(token)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function registerAction(
  email: string,
  password: string,
  name: string,
  role: Role
): Promise<AuthResponse> {
  const validated = registerSchema.safeParse({ email, password, name, role })

  if (!validated.success) {
    return { success: false, error: 'Validation failed', details: validated.error.errors }
  }

  try {
    const prisma = await getPrisma()
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.data.email }
    })

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    const hashedPassword = await bcryptjs.hash(validated.data.password, 10)

    const user = await prisma.user.create({
      data: {
        email: validated.data.email,
        password: hashedPassword,
        name: validated.data.name,
        role: validated.data.role
      }
    })

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    await setTokenCookie(token)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function logoutAction(): Promise<never> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
  redirect('/login')
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const decoded = await verifyToken(token)

    if (!decoded) {
      return null
    }
    
    const prisma = await getPrisma()
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    return user
  } catch (error) {
    return null
  }
}