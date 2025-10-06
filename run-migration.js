#!/usr/bin/env node

/**
 * Script to run SQL migrations on Supabase
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

async function runMigration(migrationFile) {
  console.log(`\n🚀 Running migration: ${path.basename(migrationFile)}\n`)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables!')
    process.exit(1)
  }

  // Read migration file
  const migrationSQL = fs.readFileSync(migrationFile, 'utf-8')

  console.log('📄 Migration content:')
  console.log('─'.repeat(60))
  console.log(migrationSQL)
  console.log('─'.repeat(60))

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Execute migration using REST API
    console.log('\n⏳ Executing migration...\n')

    // Split SQL into individual statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      })

      if (error) {
        // Try direct execution if RPC doesn't work
        console.log('Trying direct execution...')

        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: statement })
        })

        if (!response.ok) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message)
          console.error('Statement:', statement.substring(0, 100) + '...')
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }

    console.log('\n✅ Migration completed!\n')
    console.log('Please verify the changes in your Supabase dashboard.')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nPlease run this migration manually in Supabase SQL Editor:')
    console.error(`File: ${migrationFile}`)
    process.exit(1)
  }
}

// Get migration file from command line or use the latest one
const migrationArg = process.argv[2]
let migrationFile

if (migrationArg) {
  migrationFile = path.join(__dirname, 'migrations', migrationArg)
} else {
  // Use the latest migration
  migrationFile = path.join(__dirname, 'migrations', '20241001_add_user_id_to_projects.sql')
}

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Migration file not found: ${migrationFile}`)
  console.error('\nAvailable migrations:')
  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
  files.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
}

console.log('⚠️  NOTE: Supabase REST API may not support direct SQL execution.')
console.log('If this script fails, please copy the migration SQL and run it manually')
console.log('in your Supabase dashboard at: SQL Editor → New Query\n')

runMigration(migrationFile)
