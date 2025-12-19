const { PrismaClient, Role } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.review.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  console.log('👥 Creating users...')

  const hashedPassword = await bcrypt.hash('Password123', 10)

  const owner1 = await prisma.user.create({
    data: {
      email: 'owner1@example.com',
      name: 'John Smith',
      password: hashedPassword,
      role: Role.OWNER,
    },
  })

  const owner2 = await prisma.user.create({
    data: {
      email: 'owner2@example.com',
      name: 'Sarah Johnson',
      password: hashedPassword,
      role: Role.OWNER,
    },
  })

  const reviewer1 = await prisma.user.create({
    data: {
      email: 'reviewer1@example.com',
      name: 'Mike Chen',
      password: hashedPassword,
      role: Role.REVIEWER,
    },
  })

  const reviewer2 = await prisma.user.create({
    data: {
      email: 'reviewer2@example.com',
      name: 'Emily Davis',
      password: hashedPassword,
      role: Role.REVIEWER,
    },
  })

  const reviewer3 = await prisma.user.create({
    data: {
      email: 'reviewer3@example.com',
      name: 'David Wilson',
      password: hashedPassword,
      role: Role.REVIEWER,
    },
  })

  console.log(`✅ Created ${5} users`)

  // Create restaurants
  console.log('🍽️  Creating restaurants...')

  const restaurant1 = await prisma.restaurant.create({
    data: {
      title: 'The Golden Dragon',
      description: 'Authentic Chinese cuisine with a modern twist. Family-owned for over 20 years.',
      location: 'San Francisco, CA',
      cuisine: ['Chinese'],
      imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e',
      ownerId: owner1.id,
    },
  })

  const restaurant2 = await prisma.restaurant.create({
    data: {
      title: 'Pasta Paradise',
      description: 'Traditional Italian recipes passed down through generations. Fresh pasta made daily.',
      location: 'New York, NY',
      cuisine: ['Italian', 'Mediterranean'],
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
      ownerId: owner1.id,
    },
  })

  const restaurant3 = await prisma.restaurant.create({
    data: {
      title: 'Sushi Haven',
      description: 'Premium sushi and Japanese delicacies. Omakase experience available.',
      location: 'Los Angeles, CA',
      cuisine: ['Japanese'],
      imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351',
      ownerId: owner2.id,
    },
  })

  const restaurant4 = await prisma.restaurant.create({
    data: {
      title: 'Burger Bistro',
      description: 'Gourmet burgers with locally sourced ingredients. Craft beers on tap.',
      location: 'Austin, TX',
      cuisine: ['American'],
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
      ownerId: owner2.id,
    },
  })

  const restaurant5 = await prisma.restaurant.create({
    data: {
      title: 'Spice Route',
      description: 'Journey through Indian flavors. Vegetarian and vegan options available.',
      location: 'Seattle, WA',
      cuisine: ['Indian'],
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe',
      ownerId: owner1.id,
    },
  })

  console.log(`✅ Created ${5} restaurants`)

  // Create reviews
  console.log('⭐ Creating reviews...')

  const reviews = [
    // Reviews for The Golden Dragon
    {
      rating: 5,
      comment: 'Absolutely amazing! The dim sum is the best I\'ve had outside of China. Service was exceptional.',
      restaurantId: restaurant1.id,
      userId: reviewer1.id,
    },
    {
      rating: 4,
      comment: 'Great food and atmosphere. The Peking duck was delicious. Only downside was the wait time.',
      restaurantId: restaurant1.id,
      userId: reviewer2.id,
    },
    {
      rating: 5,
      comment: 'This place never disappoints! Been coming here for years and it\'s always excellent.',
      restaurantId: restaurant1.id,
      userId: reviewer3.id,
    },

    // Reviews for Pasta Paradise
    {
      rating: 5,
      comment: 'The carbonara is to die for! Authentic Italian taste. Highly recommend.',
      restaurantId: restaurant2.id,
      userId: reviewer1.id,
    },
    {
      rating: 4,
      comment: 'Good pasta, generous portions. The tiramisu was perfect for dessert.',
      restaurantId: restaurant2.id,
      userId: reviewer3.id,
    },

    // Reviews for Sushi Haven
    {
      rating: 5,
      comment: 'Best sushi in LA! Fresh fish, great presentation. The omakase is worth every penny.',
      restaurantId: restaurant3.id,
      userId: reviewer1.id,
    },
    {
      rating: 5,
      comment: 'Incredible experience. The chef really knows his craft. Will definitely return.',
      restaurantId: restaurant3.id,
      userId: reviewer2.id,
    },
    {
      rating: 4,
      comment: 'Very good sushi. Prices are a bit high but the quality justifies it.',
      restaurantId: restaurant3.id,
      userId: reviewer3.id,
    },

    // Reviews for Burger Bistro
    {
      rating: 4,
      comment: 'Solid burgers with creative toppings. The bacon jam burger is a must-try!',
      restaurantId: restaurant4.id,
      userId: reviewer2.id,
    },
    {
      rating: 3,
      comment: 'Good burgers but nothing extraordinary. Nice beer selection though.',
      restaurantId: restaurant4.id,
      userId: reviewer3.id,
    },

    // Reviews for Spice Route
    {
      rating: 5,
      comment: 'Amazing curry! The butter chicken and naan are perfect. Great vegetarian options too.',
      restaurantId: restaurant5.id,
      userId: reviewer2.id,
    },
    {
      rating: 4,
      comment: 'Flavorful dishes with the right amount of spice. The samosas were crispy and delicious.',
      restaurantId: restaurant5.id,
      userId: reviewer3.id,
    },
  ]

  for (const review of reviews) {
    await prisma.review.create({ data: review })
  }

  console.log(`✅ Created ${reviews.length} reviews`)

  console.log('🎉 Seeding completed successfully!')
  console.log('\n📝 Test credentials:')
  console.log('   Owner 1: owner1@example.com / Password123')
  console.log('   Owner 2: owner2@example.com / Password123')
  console.log('   Reviewer 1: reviewer1@example.com / Password123')
  console.log('   Reviewer 2: reviewer2@example.com / Password123')
  console.log('   Reviewer 3: reviewer3@example.com / Password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
