# Quick Setup for Lifetime Access

## Step 1: Apply Database Migration

**You need to run this SQL in your Supabase dashboard:**

1. Go to your Supabase project: https://supabase.com/dashboard/project/mdxskctiwpiwlzkdihdp
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste this entire SQL code:

```sql
-- Create subscriptions table to manage user access levels
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'monthly', 'yearly', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions table
CREATE POLICY "Users can view their own subscription" 
  ON public.subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
  ON public.subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
  ON public.subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user subscription creation
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;

-- Create trigger for new user subscription
CREATE TRIGGER on_auth_user_subscription_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();

-- Create function to check if user has lifetime access
CREATE OR REPLACE FUNCTION public.has_lifetime_access(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = user_uuid 
    AND plan_type = 'lifetime' 
    AND status = 'active'
  );
END;
$$;

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active'
    AND (
      plan_type = 'lifetime' 
      OR (plan_type IN ('monthly', 'yearly') AND end_date > now())
    )
  );
END;
$$;
```

4. Click "Run" to execute the SQL

## Step 2: Get Your Service Role Key

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **"service_role"** key (not the anon key)
3. Set it as an environment variable:

```bash
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

## Step 3: Grant Lifetime Access

After setting the environment variable, run:

```bash
npm run grant-lifetime sarfarazalam.sa460@gmail.com
```

## Step 4: Verify

Run this to check if everything worked:

```bash
npm run check-db
```

You should see: `🎉 User has lifetime access!`

## What This Does

✅ Creates the subscriptions table in your database
✅ Sets up security policies
✅ Grants lifetime access to sarfarazalam.sa460@gmail.com
✅ Removes all upload limits
✅ Gives access to all premium features

Once complete, refresh your app and you'll have unlimited access! 