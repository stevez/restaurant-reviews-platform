'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'

export function LogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
