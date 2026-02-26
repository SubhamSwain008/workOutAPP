-- run similar command in supabase SQL editor

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS Policies for workout_day table
-- Enable RLS
ALTER TABLE workout_day ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Users can view their own workout days
CREATE POLICY "Users can view their own workout days" 
ON workout_day 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workout_plan 
    WHERE workout_plan.id = workout_day.plan_id 
    AND workout_plan.user_id = auth.uid()
  )
);

-- Policy for INSERT: Users can insert workout days for their own plans
CREATE POLICY "Users can insert their own workout days" 
ON workout_day 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_plan 
    WHERE workout_plan.id = workout_day.plan_id 
    AND workout_plan.user_id = auth.uid()
  )
);

-- Policy for UPDATE: Users can update their own workout days
CREATE POLICY "Users can update their own workout days" 
ON workout_day 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM workout_plan 
    WHERE workout_plan.id = workout_day.plan_id 
    AND workout_plan.user_id = auth.uid()
  )
);

-- Policy for DELETE: Users can delete their own workout days
CREATE POLICY "Users can delete their own workout days" 
ON workout_day 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM workout_plan 
    WHERE workout_plan.id = workout_day.plan_id 
    AND workout_plan.user_id = auth.uid()
  )
);

-- ============================================
-- MIGRATION: Change split_type from text to text[]
-- ============================================
-- Run this in your Supabase SQL editor to convert split_type to an array

-- Step 1: Add a temporary column to store the array
ALTER TABLE workout_plan ADD COLUMN IF NOT EXISTS split_type_array text[];

-- Step 2: Convert existing data - split by '/' and trim spaces
-- This handles existing formats like "push / pull / legs"
UPDATE workout_plan 
SET split_type_array = string_to_array(split_type, '/') 
WHERE split_type_array IS NULL;

-- Clean up whitespace from array elements
UPDATE workout_plan 
SET split_type_array = array(
  SELECT trim(unnest(split_type_array))
);

-- Step 3: Drop the old column
ALTER TABLE workout_plan DROP COLUMN split_type;

-- Step 4: Rename the new column to split_type
ALTER TABLE workout_plan RENAME COLUMN split_type_array TO split_type;

-- Step 5 (Optional): Add a constraint to ensure non-empty arrays
ALTER TABLE workout_plan 
ADD CONSTRAINT split_type_not_empty 
CHECK (array_length(split_type, 1) > 0);
