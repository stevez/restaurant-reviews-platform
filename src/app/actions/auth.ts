'use server'

import { cookies } from 'next/headers'
import bcryptjs from 'bcryptjs'
import { prisma } from '@/lib/db'
import { loginSchema, registerSchema } from '@/lib/validators'
import { generateToken, verifyToken, setTokenCookie } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Role } from '@prisma/client'

type UserSession = {
  id: string
  email: string
  name: string
  role: Role
}

type AuthSuccessResponse = {
  success: true
  user: UserSession
}

type AuthErrorResponse = {
  error: string
  details?: any
}

export async function loginAction(
  email: string,
  password: string
): Promise<AuthSuccessResponse | AuthErrorResponse> {
  try {
    const validated = loginSchema.parse({ email, password })
    
    const user = await prisma.user.findUnique({
      where: { email: validated.email }
    })
    
    if (!user) {
      return { error: 'Invalid email or password' }
    }
    
    const isPasswordValid = await bcryptjs.compare(
      validated.password,
      user.password
    )
    
    if (!isPasswordValid) {
      return { error: 'Invalid email or password' }
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { error: 'Invalid input', details: error.errors }
    }
    console.error('Login error:', error)
    return { error: 'Internal server error' }
  }
}

export async function registerAction(
  email: string,
  password: string,
  name: string,
  role: 'REVIEWER' | 'OWNER'
): Promise<AuthSuccessResponse | AuthErrorResponse> {
  try {
    const validated = registerSchema.parse({ email, password, name, role })
    
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    })
    
    if (existingUser) {
      return { error: 'Email already registered' }
    }
    
    const hashedPassword = await bcryptjs.hash(validated.password, 10)
    
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
        role: validated.role
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return { error: 'Validation failed', details: error.errors }
    }
    console.error('Registration error:', error)
    return { error: 'Internal server error' }
  }
}

export async function logoutAction(): Promise<never> {
  cookies().delete('auth-token')
  redirect('/login')
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const token = cookies().get('auth-token')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const decoded = await verifyToken(token)

    if (!decoded) {
      return null
    }
    
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