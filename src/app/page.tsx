import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/firebase/auth'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  let session = null
  try {
    session = await getAdminSession()
  } catch {
    session = null
  }

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
}
