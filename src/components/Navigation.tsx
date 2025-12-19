import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth'
import { LogoutButton } from '@/components/auth/LogoutButton'

export async function Navigation() {
  const user = await getCurrentUser()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-4 flex-wrap gap-4">
          <div className="leading-loose">
            <Link href="/" className="font-bold text-2xl md:text-3xl text-gray-900 hover:text-blue-600">
              Restaurant Reviews
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            {user ? (
              <>
                <span className="text-xs md:text-sm text-gray-600 hidden sm:inline">
                  Welcome, <span className="font-semibold">{user.name}</span>
                </span>

                {user.role === 'OWNER' ? (
                  <>
                    <Link
                      href="/owner/my-restaurants"
                      className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                    >
                      My Restaurants
                    </Link>
                    <Link
                      href="/owner/create"
                      className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                    >
                      Add Restaurant
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/"
                    className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                  >
                    Browse Restaurants
                  </Link>
                )}

                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-xs md:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 md:px-4 py-1.5 md:py-2 rounded-md whitespace-nowrap"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
