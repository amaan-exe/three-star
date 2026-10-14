import { redirect } from 'next/navigation'

// Registration is disabled — this is a single-tenant app for Residence Inn Hotel only.
export default function SignupPage() {
  redirect('/login')
}
