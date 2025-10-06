#!/usr/bin/env node

/**
 * Script to create an admin user with confirmed email
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=')
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = values.join('=').trim()
    }
  })
}

async function createAdminUser() {
  console.log('🔐 Creating admin user...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables!')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Get email and password from command line or use defaults
  const email = process.argv[2] || 'admin@example.com'
  const password = process.argv[3] || 'admin123456'

  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Password: ${password}`)
  console.log('')

  try {
    // First check if user exists
    const { data: users } = await supabase.auth.admin.listUsers()
    const existingUser = users.users.find(u => u.email === email)

    if (existingUser) {
      console.log('⚠️  User already exists!')
      console.log('Updating existing user...\n')

      // Update password and confirm email
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: existingUser.user_metadata?.full_name || 'Admin User',
            role: 'admin'
          }
        }
      )

      if (updateError) {
        console.error('❌ Error updating user:', updateError.message)
        process.exit(1)
      }

      console.log('✅ User updated successfully!')
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Email Confirmed: Yes`)
      console.log(`   New Password: ${password}`)
    } else {
      // Create user with Admin API (bypasses email confirmation)
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: 'Admin User',
          role: 'admin'
        }
      })

      if (error) {
        console.error('❌ Error creating user:', error.message)
        process.exit(1)
      }

      console.log('✅ User created successfully!')
      console.log(`   ID: ${data.user.id}`)
      console.log(`   Email: ${data.user.email}`)
      console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
    }

    console.log('\n✅ You can now login with:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log('\n🌐 Login at: http://localhost:3001/login')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

console.log('Usage: node create-admin-user.js [email] [password]')
console.log('Example: node create-admin-user.js admin@example.com mypassword123\n')

createAdminUser()
