#!/usr/bin/env node

/**
 * Test script to verify Supabase connection and database schema
 */

// Load environment variables from .env.local
const fs = require('fs')
const path = require('path')

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

const { createClient } = require('@supabase/supabase-js')

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables!')
    console.error('Please check your .env.local file.')
    process.exit(1)
  }

  console.log(`📍 Supabase URL: ${supabaseUrl}`)

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test 1: Check tables exist
    console.log('\n📋 Checking database tables...')

    const tables = ['projects', 'payment_installments', 'transactions', 'users']

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error(`❌ Table '${table}' error:`, error.message)
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`)
      }
    }

    // Test 2: Check authentication
    console.log('\n🔐 Checking authentication setup...')

    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ Auth error:', usersError.message)
    } else {
      console.log(`✅ Authentication working. Found ${users.length} user(s)`)
      if (users.length > 0) {
        console.log('   Users:')
        users.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id})`)
        })
      }
    }

    // Test 3: Check if we need to run migrations
    console.log('\n🔄 Checking if user_id column exists in projects table...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, user_id')
      .limit(1)

    if (projectsError) {
      if (projectsError.message.includes('user_id')) {
        console.log('⚠️  Column user_id does not exist in projects table')
        console.log('   You need to run the migration to add user_id column!')
      } else {
        console.error('❌ Error:', projectsError.message)
      }
    } else {
      console.log('✅ Projects table has user_id column')
    }

    console.log('\n✅ Connection test complete!')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

testConnection()
