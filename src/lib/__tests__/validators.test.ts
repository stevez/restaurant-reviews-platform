import {
  emailSchema,
  passwordSchema,
  registerSchema,
  loginSchema,
  restaurantSchema,
  reviewSchema,
} from '../validators'

describe('Validators', () => {
  describe('emailSchema', () => {
    it('should validate correct email', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow()
    })

    it('should reject invalid email', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow()
      expect(() => emailSchema.parse('test@')).toThrow()
      expect(() => emailSchema.parse('@example.com')).toThrow()
    })
  })

  describe('passwordSchema', () => {
    it('should validate strong password', () => {
      expect(() => passwordSchema.parse('Password123')).not.toThrow()
      expect(() => passwordSchema.parse('MyP@ssw0rd')).not.toThrow()
    })

    it('should reject password without uppercase', () => {
      expect(() => passwordSchema.parse('password123')).toThrow('uppercase')
    })

    it('should reject password without lowercase', () => {
      expect(() => passwordSchema.parse('PASSWORD123')).toThrow('lowercase')
    })

    it('should reject password without number', () => {
      expect(() => passwordSchema.parse('PasswordABC')).toThrow('number')
    })

    it('should reject short password', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow('8 characters')
    })
  })

  describe('registerSchema', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'John Doe',
      role: 'REVIEWER' as const,
    }

    it('should validate correct registration data', () => {
      expect(() => registerSchema.parse(validRegisterData)).not.toThrow()
    })

    it('should validate OWNER role', () => {
      expect(() =>
        registerSchema.parse({ ...validRegisterData, role: 'OWNER' })
      ).not.toThrow()
    })

    it('should reject invalid role', () => {
      expect(() =>
        registerSchema.parse({ ...validRegisterData, role: 'ADMIN' })
      ).toThrow()
    })

    it('should reject empty name', () => {
      expect(() =>
        registerSchema.parse({ ...validRegisterData, name: '' })
      ).toThrow('Name is required')
    })

    it('should reject missing fields', () => {
      expect(() => registerSchema.parse({})).toThrow()
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validLoginData = {
        email: 'test@example.com',
        password: 'anypassword',
      }
      expect(() => loginSchema.parse(validLoginData)).not.toThrow()
    })

    it('should reject invalid email', () => {
      expect(() =>
        loginSchema.parse({ email: 'invalid', password: 'password' })
      ).toThrow()
    })

    it('should reject empty password', () => {
      expect(() =>
        loginSchema.parse({ email: 'test@example.com', password: '' })
      ).toThrow('Password is required')
    })
  })

  describe('restaurantSchema', () => {
    const validRestaurantData = {
      title: 'Great Restaurant',
      description: 'A wonderful place to eat',
      location: '123 Main St',
      cuisine: ['Italian', 'French'],
      imageUrl: 'https://example.com/image.jpg',
    }

    it('should validate correct restaurant data', () => {
      expect(() => restaurantSchema.parse(validRestaurantData)).not.toThrow()
    })

    it('should allow empty imageUrl', () => {
      expect(() =>
        restaurantSchema.parse({ ...validRestaurantData, imageUrl: '' })
      ).not.toThrow()
    })

    it('should allow optional imageUrl', () => {
      const { imageUrl, ...dataWithoutImage } = validRestaurantData
      expect(() => restaurantSchema.parse(dataWithoutImage)).not.toThrow()
    })

    it('should reject empty title', () => {
      expect(() =>
        restaurantSchema.parse({ ...validRestaurantData, title: '' })
      ).toThrow('Title is required')
    })

    it('should reject empty cuisine array', () => {
      expect(() =>
        restaurantSchema.parse({ ...validRestaurantData, cuisine: [] })
      ).toThrow('At least one cuisine')
    })

    it('should reject too long description', () => {
      const longDescription = 'a'.repeat(2001)
      expect(() =>
        restaurantSchema.parse({
          ...validRestaurantData,
          description: longDescription,
        })
      ).toThrow()
    })
  })

  describe('reviewSchema', () => {
    it('should validate correct review data', () => {
      expect(() =>
        reviewSchema.parse({ rating: 5, comment: 'Great!' })
      ).not.toThrow()
    })

    it('should allow review without comment', () => {
      expect(() => reviewSchema.parse({ rating: 4 })).not.toThrow()
    })

    it('should reject rating below 1', () => {
      expect(() => reviewSchema.parse({ rating: 0 })).toThrow()
    })

    it('should reject rating above 5', () => {
      expect(() => reviewSchema.parse({ rating: 6 })).toThrow()
    })

    it('should reject too long comment', () => {
      const longComment = 'a'.repeat(1001)
      expect(() =>
        reviewSchema.parse({ rating: 5, comment: longComment })
      ).toThrow()
    })
  })
})