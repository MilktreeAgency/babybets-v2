import { supabase } from '@/lib/supabase'

/**
 * Check if a file URL is currently in use in the database
 * Returns the table and count of usages
 * Uses a single database function call instead of 7 separate queries
 */
export async function checkFileUsage(fileUrl: string): Promise<{
  inUse: boolean
  usages: Array<{ table: string; count: number }>
  totalCount: number
}> {
  try {
    // Call the database function that checks all tables in one query
    const { data, error } = await supabase
      .rpc('check_file_usage', { file_url: fileUrl })

    if (error) {
      console.error('Error checking file usage:', error)
      // If there's an error checking, assume it's in use to be safe
      return {
        inUse: true,
        usages: [{ table: 'unknown (error checking)', count: 1 }],
        totalCount: 1
      }
    }

    // Filter out results with count > 0 and format the table names
    const usages: Array<{ table: string; count: number }> = (data || [])
      .filter((row: { table_name: string; count: number }) => row.count > 0)
      .map((row: { table_name: string; count: number }) => {
        // Format table names for better display
        const tableNameMap: Record<string, string> = {
          'competitions_main': 'competitions (main image)',
          'competitions_gallery': 'competitions (gallery)',
          'winners_prize': 'winners (prize_image)',
          'winners_photo': 'winners (photo)',
          'influencers_profile': 'influencers (profile)',
          'influencers_page': 'influencers (page)'
        }
        return {
          table: tableNameMap[row.table_name] || row.table_name,
          count: Number(row.count)
        }
      })

    const totalCount = usages.reduce((sum, usage) => sum + usage.count, 0)

    return {
      inUse: totalCount > 0,
      usages,
      totalCount
    }
  } catch (error) {
    console.error('Error checking file usage:', error)
    // If there's an error checking, assume it's in use to be safe
    return {
      inUse: true,
      usages: [{ table: 'unknown (error checking)', count: 1 }],
      totalCount: 1
    }
  }
}

/**
 * Get the public URL for a file in storage
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
