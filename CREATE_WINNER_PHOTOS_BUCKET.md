# Create Winner Photos Storage Bucket

The `winner-photos` bucket is needed for uploading winner testimonial photos. Here are two ways to create it:

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/ovyxmhdvkcuofmtnnacs/storage/buckets

2. Click "New bucket"

3. Configure the bucket:
   - **Name**: `winner-photos`
   - **Public bucket**: ✓ (checked)
   - **File size limit**: 5 MB
   - **Allowed MIME types**:
     - image/jpeg
     - image/jpg
     - image/png
     - image/gif
     - image/webp

4. Click "Create bucket"

## Option 2: Via SQL (Alternative)

Run this SQL in the Supabase SQL Editor:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-photos',
  'winner-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

## Verify Bucket Creation

After creating the bucket, verify it exists by running:

```sql
SELECT * FROM storage.buckets WHERE id = 'winner-photos';
```

You should see one row returned with the bucket details.

## Policies

The necessary RLS policies have already been created via migrations:
- Public can view winner photos
- Authenticated users can upload/update/delete winner photos

Once the bucket is created, uploads should work correctly!
