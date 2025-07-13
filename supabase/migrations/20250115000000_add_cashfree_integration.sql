-- Add Cashfree integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN cashfree_customer_id TEXT UNIQUE,
ADD COLUMN cashfree_customer_email TEXT;

-- Update subscriptions table to support Cashfree subscription IDs
ALTER TABLE public.subscriptions 
ADD COLUMN cashfree_subscription_id TEXT UNIQUE,
ADD COLUMN plan_id TEXT,
ADD COLUMN current_period_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for better performance
CREATE INDEX idx_subscriptions_cashfree_id ON public.subscriptions(cashfree_subscription_id);
CREATE INDEX idx_profiles_cashfree_customer_id ON public.profiles(cashfree_customer_id);

-- Update the subscription status check to include new statuses
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'paused', 'cancelled', 'expired'));

-- Create function to get user's active subscription
CREATE OR REPLACE FUNCTION public.get_user_active_subscription(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  plan_type TEXT,
  plan_id TEXT,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.plan_type,
    s.plan_id,
    s.status,
    s.current_period_start,
    s.current_period_end
  FROM public.subscriptions s
  WHERE s.user_id = user_uuid 
  AND s.status IN ('active', 'trialing')
  AND (
    s.plan_type = 'lifetime' 
    OR s.current_period_end > now()
  )
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$; 