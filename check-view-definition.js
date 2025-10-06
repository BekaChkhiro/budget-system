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

async function checkViewDefinition() {
  console.log('🔍 Checking view definition...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Query to get view definition
  const { data, error } = await supabase
    .rpc('pg_get_viewdef', { viewname: 'project_summary' })
    .single()

  if (error) {
    console.log('Trying alternative query...')

    // Alternative: query pg_views
    const { data: viewData, error: viewError } = await supabase
      .from('pg_views')
      .select('definition')
      .eq('viewname', 'project_summary')
      .single()

    if (viewError) {
      console.error('❌ Error:', viewError.message)
      return
    }

    console.log('View definition:')
    console.log(viewData.definition)
  } else {
    console.log('View definition:')
    console.log(data)
  }

  // Let's also manually calculate for a project
  console.log('\n\n📊 Manual calculation for Mobile App Development:\n')

  const projectId = 'fc24ee12-139c-424e-b75c-d35e022b7b2f'

  // Get project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  console.log('Project:', project.title, '- Budget:', project.total_budget)

  // Get transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount')
    .eq('project_id', projectId)

  console.log('\nTransactions:')
  let total = 0
  transactions.forEach(t => {
    console.log(`  - ${t.amount}`)
    total += t.amount
  })

  console.log('\nTotal received:', total)
  console.log('Remaining:', project.total_budget - total)
  console.log('Completion:', ((total / project.total_budget) * 100).toFixed(2) + '%')
}

checkViewDefinition().catch(console.error)
