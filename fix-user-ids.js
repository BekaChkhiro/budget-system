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

async function fixUserIds() {
  console.log('🔧 Fixing user_id for existing projects...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Get the user to assign
  const userEmail = process.argv[2] || 'bekachkhirodze1@gmail.com'

  console.log(`📧 Looking for user: ${userEmail}`)

  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email === userEmail)

  if (!user) {
    console.error('❌ User not found!')
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`)

  // Update all projects without user_id
  const { data: projects, error: selectError } = await supabase
    .from('projects')
    .select('*')
    .is('user_id', null)

  if (selectError) {
    console.error('❌ Error fetching projects:', selectError.message)
    process.exit(1)
  }

  if (projects.length === 0) {
    console.log('✅ No projects need updating!')
    return
  }

  console.log(`📊 Found ${projects.length} project(s) without user_id:\n`)
  projects.forEach(p => {
    console.log(`  - ${p.title}`)
  })

  console.log(`\n🔄 Updating projects to user_id: ${user.id}...\n`)

  const { data, error } = await supabase
    .from('projects')
    .update({ user_id: user.id })
    .is('user_id', null)
    .select()

  if (error) {
    console.error('❌ Error updating projects:', error.message)
    process.exit(1)
  }

  console.log(`✅ Successfully updated ${data.length} project(s)!\n`)

  data.forEach(p => {
    console.log(`  ✓ ${p.title} → user_id: ${p.user_id}`)
  })

  console.log('\n✅ All done! Your projects should now be visible.')
}

console.log('Usage: node fix-user-ids.js [email]\n')
fixUserIds()
