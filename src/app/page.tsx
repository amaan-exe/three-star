import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/firebase/auth'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  try {
    const params = await searchParams
    const session = await getAdminSession()

    if (session) {
      redirect('/dashboard')
    }

    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params || {})) {
      if (typeof value === 'string') {
        query.set(key, value)
      }
    }
    const queryString = query.toString()

    redirect(queryString ? `/login?${queryString}` : '/login')
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err
    }
    redirect('/login')
  }
}
