export class SignJWT {
  private payload: any
  private header: any

  constructor(payload: any) {
    this.payload = payload
  }

  setProtectedHeader(header: any) {
    this.header = header
    return this
  }

  setIssuedAt() {
    this.payload.iat = Math.floor(Date.now() / 1000)
    return this
  }

  setExpirationTime(exp: string) {
    const seconds = parseInt(exp.replace('s', ''))
    this.payload.exp = this.payload.iat + seconds
    return this
  }

  async sign(secret: Uint8Array) {
    // Create a simple JWT-like token for testing
    const header = Buffer.from(JSON.stringify(this.header || { alg: 'HS256' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify(this.payload)).toString('base64url')
    const signature = 'mock_signature'
    return `${header}.${payload}.${signature}`
  }
}

export async function jwtVerify(token: string, secret: Uint8Array) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return {
      payload,
      protectedHeader: { alg: 'HS256' },
    }
  } catch (error) {
    throw new Error('Invalid token')
  }
}
