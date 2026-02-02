import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function ensureWinnerPhotosBucket() {
  console.log('Checking for winner-photos bucket...')

  // List all buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    console.error('Error listing buckets:', listError)
    process.exit(1)
  }

  console.log('Existing buckets:', buckets?.map(b => b.name).join(', '))

  // Check if winner-photos exists
  const winnerPhotosBucket = buckets?.find(b => b.id === 'winner-photos')

  if (winnerPhotosBucket) {
    console.log('✓ winner-photos bucket already exists')
    return
  }

  console.log('Creating winner-photos bucket...')

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('winner-photos', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  })

  if (error) {
    console.error('Error creating bucket:', error)
    process.exit(1)
  }

  console.log('✓ winner-photos bucket created successfully:', data)
}

ensureWinnerPhotosBucket()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })
