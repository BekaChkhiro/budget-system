#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
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

async function checkProjectSummary() {
  console.log('🔍 Checking project_summary view...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  // Get the user
  const { data: { users } } = await supabase.auth.admin.listUsers
    ? await supabase.auth.admin.listUsers()
    : { data: { users: [] } }

  console.log('📧 Users in system:', users.length)

  const user = users.find(u => u.email === 'bekachkhirodze1@gmail.com')
  if (user) {
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`)
  }

  // Check project_summary view
  console.log('📊 Checking project_summary view...\n')

  const { data: projects, error } = await supabase
    .from('project_summary')
    .select('*')

  if (error) {
    console.error('❌ Error fetching project_summary:', error.message)
    console.error('Details:', error)
    return
  }

  console.log(`Found ${projects.length} projects in project_summary view:\n`)

  projects.forEach(project => {
    console.log(`📁 ${project.title}`)
    console.log(`   ID: ${project.id}`)
    console.log(`   Budget: ${project.total_budget}`)
    console.log(`   Received: ${project.received_amount || 'NULL'}`)
    console.log(`   Remaining: ${project.remaining_amount || 'NULL'}`)
    console.log(`   Completion: ${project.completion_percentage || 'NULL'}%`)
    console.log(`   Completed: ${project.is_completed}`)
    console.log(`   Type: ${project.payment_type}`)
    console.log()
  })

  // Try to fetch as authenticated user
  if (user) {
    console.log('\n🔐 Checking with authenticated context...\n')

    // Note: We can't actually authenticate here without credentials
    // But we can check RLS policies
    const { data: authProjects, error: authError } = await supabase
      .from('project_summary')
      .select('*')
      .eq('user_id', user.id)

    if (authError) {
      console.error('❌ Error with user filter:', authError.message)
    } else {
      console.log(`✅ Found ${authProjects.length} projects for user ${user.email}`)
      authProjects.forEach(p => {
        console.log(`   - ${p.title}: Budget ${p.total_budget}, Received ${p.received_amount || 0}`)
      })
    }
  }
}

checkProjectSummary().catch(console.error)
