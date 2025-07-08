
-- Add the missing trade_type column to the trades table
ALTER TABLE public.trades ADD COLUMN trade_type TEXT;
