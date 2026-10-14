#!/usr/bin/env node
/**
 * PM Zaika Restaurant - Change Admin Password CLI Script
 *
 * Usage:
 *   node scripts/change-password.js <newPassword> [usernameOrEmail]
 *   npm run change-password <newPassword> [usernameOrEmail]
 *
 * Examples:
 *   npm run change-password MyNewSecretPass123
 *   npm run change-password MyNewSecretPass123 admin
 *   npm run change-password MyNewSecretPass123 invincibleperson9@gmail.com
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const PRIMARY_EMAIL = 'invincibleperson9@gmail.com'
const ALIASES = new Set([
  'admin',
  'owner',
  'residence',
  'residenceinn',
  'residence-inn',
  'admin@residenceinn.com',
  'owner@residenceinn.com',
  'zaika',
  'pmzaika',
  'pm-zaika',
  'admin@pmzaika.com',
  'owner@pmzaika.com',
  'admin@pm-zaika.com',
  'owner@pm-zaika.com',
  'pmzaika@gmail.com',
  'pmzaikapatna@gmail.com',
  'biryani',
  'charminar',
])

function resolveEmail(input) {
  if (!input) return PRIMARY_EMAIL
  const clean = input.trim().toLowerCase()
  if (ALIASES.has(clean)) return PRIMARY_EMAIL
  return input.trim()
}

// 1. Validate arguments
const newPassword = process.argv[2]
const userInput = process.argv[3] || 'admin'
const targetEmail = resolveEmail(userInput)

if (!newPassword || newPassword.length < 8) {
  console.error('\n❌ Error: Password is required and must be at least 8 characters long.')
  console.log('\nUsage:')
  console.log('   npm run change-password <newPassword> [usernameOrEmail]')
  console.log('\nExample:')
  console.log('   npm run change-password SecurePass@2026 admin\n')
  process.exit(1)
}

// 2. Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local')
if (!fs.existsSync(envPath)) {
  console.error('\n❌ Error: .env.local file was not found in project root.\n')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local\n')
  process.exit(1)
}

// 3. Initialize Supabase Admin Client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  console.log('\n======================================================')
  console.log('   PM Zaika Restaurant — Change Password CLI')
  console.log('======================================================')
  console.log(`Target User: ${targetEmail} (input: "${userInput}")`)

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('\n❌ Failed to query Supabase Auth users:', listError.message)
    process.exit(1)
  }

  const user = usersData.users.find(
    (u) => u.email && u.email.toLowerCase() === targetEmail.toLowerCase()
  )

  if (!user) {
    console.error(`\n❌ User with email "${targetEmail}" was not found in Supabase Auth.`)
    console.log('Existing registered users in this Supabase project:')
    usersData.users.forEach((u) => console.log(` - ${u.email} (ID: ${u.id})`))
    console.log('')
    process.exit(1)
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateError) {
    console.error('\n❌ Failed to update password in Supabase:', updateError.message)
    process.exit(1)
  }

  console.log('\n✅ SUCCESS: Password updated successfully!')
  console.log('------------------------------------------------------')
  console.log(`User Email : ${user.email}`)
  console.log(`User ID    : ${user.id}`)
  console.log(`New Password: ${newPassword}`)
  console.log('------------------------------------------------------')
  console.log('You can now log in at:')
  console.log('  Local:      http://localhost:3000/login')
  console.log('  Production: https://three-star-ebon.vercel.app/login')
  console.log('  Username:   admin (or ' + user.email + ')\n')
}

run()
