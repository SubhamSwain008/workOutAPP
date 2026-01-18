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
