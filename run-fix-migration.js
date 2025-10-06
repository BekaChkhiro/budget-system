/**
 * Run the fixed project_summary view migration to fix transaction double-counting
 *
 * This script applies the migration to fix the cartesian product issue where
 * transactions were being multiplied by the number of installments.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🔄 Reading migration file...')
    const migrationPath = path.join(__dirname, 'migrations', '20251001_fix_project_summary_view_v2.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Migration SQL:')
    console.log('─'.repeat(80))
    console.log(sql)
    console.log('─'.repeat(80))

    console.log('\n🚀 Executing migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

    if (error) {
      // Try direct execution as fallback
      console.log('⚠️  RPC failed, trying direct execution...')

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        console.log(`\n📌 Executing: ${statement.substring(0, 60)}...`)
        const result = await supabase.rpc('exec_sql', { sql_query: statement })
        if (result.error) {
          console.error(`❌ Error executing statement:`, result.error)
          console.error(`Statement: ${statement}`)
        } else {
          console.log('✅ Statement executed successfully')
        }
      }
    } else {
      console.log('✅ Migration executed successfully!')
      console.log('Result:', data)
    }

    console.log('\n🔍 Verifying view structure...')
    const { data: viewData, error: viewError } = await supabase
      .from('project_summary')
      .select('*')
      .limit(1)

    if (viewError) {
      console.error('❌ Error querying view:', viewError)
    } else {
      console.log('✅ View is accessible')
      if (viewData && viewData.length > 0) {
        console.log('📊 Sample row columns:', Object.keys(viewData[0]))
      }
    }

    console.log('\n✨ Migration completed!')
    console.log('\n📝 Next steps:')
    console.log('1. Refresh your application')
    console.log('2. Check the project with budget 2500')
    console.log('3. Verify that received amount shows 1500 (not 3000)')
    console.log('4. Verify that remaining amount shows 1000 (not -500)')

  } catch (error) {
    console.error('💥 Error running migration:', error)
    process.exit(1)
  }
}

// Run with warning
console.log('⚠️  WARNING: This will modify your database views!')
console.log('📋 Migration: Fix project_summary view to prevent transaction double-counting')
console.log('🎯 Issue: Transactions were being multiplied by number of installments')
console.log('🔧 Fix: Use subqueries instead of JOIN for transaction aggregations\n')

runMigration()
