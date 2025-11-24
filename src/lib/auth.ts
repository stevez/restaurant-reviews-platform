import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface AuthPayload {
  userId: string
  email: string
  role: 'REVIEWER' | 'OWNER'
}

export interface JWTPayload extends AuthPayload {
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds

// Convert secret to Uint8Array for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET)

export async function generateToken(payload: AuthPayload): Promise<string> {
  try {
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${TOKEN_EXPIRY}s`)
      .sign(getSecretKey())

    return token
  } catch (error) {
    console.error('Error generating token:', error)
    throw new Error('Failed to generate token')
  }
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())

    // Validate that required fields exist
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      (payload.role === 'REVIEWER' || payload.role === 'OWNER')
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as 'REVIEWER' | 'OWNER',
        iat: payload.iat,
        exp: payload.exp,
      }
    }

    return null
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = cookies()
  return cookieStore.get('auth-token')?.value || null
}

export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY,
  })
}

export async function clearTokenCookie(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies()
  if (!token) return null
  return await verifyToken(token)
}