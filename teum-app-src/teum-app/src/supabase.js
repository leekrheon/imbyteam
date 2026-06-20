import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://tdakaglxrdiowhaiaxwt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYWthZ2x4cmRpb3doYWlheHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MzAxNzEsImV4cCI6MjA5NzUwNjE3MX0.uGbUkcRIPw889G-EnTdb4uKXrCIjEHWCftSvr48sAhc'
)
