#!/usr/bin/env node

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

async function checkData() {
  console.log('🔍 Checking database data...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Check projects
  console.log('📊 Projects:')
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (projectsError) {
    console.error('❌ Error:', projectsError.message)
  } else {
    console.log(`Found ${projects.length} project(s):\n`)
    projects.forEach(p => {
      console.log(`  - ${p.title}`)
      console.log(`    ID: ${p.id}`)
      console.log(`    User ID: ${p.user_id || 'NULL'}`)
      console.log(`    Budget: ${p.total_budget}`)
      console.log(`    Type: ${p.payment_type}`)
      console.log('')
    })
  }

  // Check transactions
  console.log('\n💰 Transactions:')
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('*, projects(title, user_id)')
    .order('created_at', { ascending: false })

  if (transError) {
    console.error('❌ Error:', transError.message)
  } else {
    console.log(`Found ${transactions.length} transaction(s):\n`)
    transactions.forEach(t => {
      console.log(`  - Amount: ${t.amount}`)
      console.log(`    Project: ${t.projects?.title || 'Unknown'}`)
      console.log(`    Project User ID: ${t.projects?.user_id || 'NULL'}`)
      console.log(`    Date: ${t.transaction_date}`)
      console.log(`    Notes: ${t.notes || 'N/A'}`)
      console.log('')
    })
  }

  // Check current user
  console.log('\n👤 Current users:')
  const { data: { users } } = await supabase.auth.admin.listUsers()
  users.forEach(u => {
    console.log(`  - ${u.email} (ID: ${u.id})`)
  })
}

checkData()
