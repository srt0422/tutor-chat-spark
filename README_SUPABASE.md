
# Supabase Functions Setup

This project includes Supabase Edge Functions that can be deployed to your Supabase project.

## Directory Structure

```
/supabase
  /functions
    /timer-stats
      - index.ts      # Records coding session time and returns stats
    /get-expected-time
      - index.ts      # Retrieves expected completion time for a level
```

## Local Development

To develop and test these functions locally:

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to your Supabase account:
   ```bash
   supabase login
   ```

3. Start the Supabase Functions development server:
   ```bash
   supabase functions serve
   ```

4. Test your function locally:
   ```bash
   curl -i --location --request POST 'http://localhost:54321/functions/v1/timer-stats' \
     --header 'Authorization: Bearer YOUR_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"levelId":"level1","timeSpent":300}'
   ```

## Database Schema

For the functions to work properly, you'll need to create the following tables in your Supabase database:

### Table: coding_sessions

```sql
create table public.coding_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  level_id text not null,
  time_spent integer not null,
  completed_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Add RLS policies as needed
alter table public.coding_sessions enable row level security;
```

### Table: levels

```sql
create table public.levels (
  id text primary key,
  name text not null,
  description text,
  difficulty text not null,
  timeEstimate text not null,
  codeLines text,
  created_at timestamp with time zone default now()
);
```

## Deployment

To deploy these functions to your Supabase project:

1. Make sure you're linked to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. Deploy the functions:
   ```bash
   supabase functions deploy
   ```

## Environment Variables

In your Lovable app, you'll need to set `VITE_SUPABASE_FUNCTIONS_URL` to point to your Supabase project's functions URL:

```
VITE_SUPABASE_FUNCTIONS_URL=https://your-project-ref.supabase.co/functions/v1
```

## Authentication

The functions are set up to work with Supabase authentication. If you want to restrict access to authenticated users, you'll need to:

1. Uncomment the Authorization header in the timerService.ts file
2. Set up appropriate Row Level Security (RLS) policies in your Supabase database

## Learn More

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)
- [Supabase Database](https://supabase.com/docs/guides/database)
