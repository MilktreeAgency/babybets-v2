# Auto Execute Draws

This edge function automatically executes competition draws for competitions that have passed their scheduled `draw_datetime`.

## How It Works

1. **GitHub Actions Cron Job**: Runs every 15 minutes via [.github/workflows/auto-execute-draws.yml](../../../.github/workflows/auto-execute-draws.yml)
2. **Edge Function**: Calls the `auto_execute_competition_draws()` database function
3. **Database Function**:
   - Finds competitions where `draw_datetime` has passed
   - Checks if the competition is eligible (status is 'closed' or 'active', has tickets sold, no draw executed yet)
   - Executes the draw using the internal draw function
   - Returns a summary of results

## Eligibility Criteria

A competition is eligible for automatic draw execution when:
- ✅ `draw_datetime` is set and has passed (is in the past)
- ✅ Status is `closed` or `active`
- ✅ Has at least 1 ticket sold
- ✅ No draw has been executed yet (no record in `draws` table)

## Manual Testing

You can manually trigger the draw execution:

### Via GitHub Actions UI
1. Go to: **Actions** → **Auto Execute Competition Draws**
2. Click **Run workflow**

### Via CLI (requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`)
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/auto-execute-draws' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Response Format

```json
{
  "success": true,
  "data": {
    "total_competitions": 2,
    "successful_draws": 2,
    "failed_draws": 0,
    "draws_executed": [
      {
        "competition_id": "uuid",
        "competition_title": "Win a Tesla Model 3",
        "draw_datetime": "2026-02-13T12:00:00Z",
        "winner_display_name": "John Smith",
        "winning_ticket_number": 1234
      }
    ],
    "errors": [],
    "processed_at": "2026-02-13T12:15:00Z",
    "message": "Processed 2 competitions. Success: 2, Failed: 0"
  }
}
```

## Error Handling

If a draw fails to execute:
- The error is logged in the `errors` array
- Other draws continue to execute
- The function returns a success response with details of both successes and failures

## Database Functions

### `auto_execute_competition_draws()`
Main entry point called by the edge function. Finds eligible competitions and executes draws.

### `execute_competition_draw_internal(p_competition_id, p_admin_id)`
Internal function that performs the actual draw execution. Bypasses admin authentication for service role calls.

## Setup Requirements

### 1. Database Migration
Run the migration to create the necessary functions:
```bash
# If using Supabase CLI
supabase db push

# Or apply the migration file
supabase/migrations/050_auto_execute_draws.sql
```

### 2. GitHub Secrets
Ensure these secrets are set in your GitHub repository:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 3. Deploy Edge Function
```bash
supabase functions deploy auto-execute-draws
```

## Monitoring

Check the GitHub Actions logs to see:
- Which competitions were checked
- Which draws were executed
- Any errors encountered

You can also query the database:
```sql
-- Recent automated draws (where executed_by is NULL)
SELECT
  d.*,
  c.title as competition_title,
  c.draw_datetime
FROM draws d
JOIN competitions c ON d.competition_id = c.id
WHERE d.executed_by IS NULL
ORDER BY d.executed_at DESC;
```

## Schedule Adjustment

To change how often draws are checked, edit the cron expression in [.github/workflows/auto-execute-draws.yml](../../../.github/workflows/auto-execute-draws.yml):

```yaml
on:
  schedule:
    # Current: Every 15 minutes
    - cron: '*/15 * * * *'

    # Options:
    # - cron: '*/5 * * * *'   # Every 5 minutes
    # - cron: '*/30 * * * *'  # Every 30 minutes
    # - cron: '0 * * * *'     # Every hour
```

## Security

- The edge function requires authorization (service role key)
- Only competitions meeting strict eligibility criteria are processed
- All draw executions are logged in the `draws` table with audit trail
- Failed draws don't affect successful ones (isolated error handling)
