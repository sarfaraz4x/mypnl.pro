-- Migration: Increase numeric precision for trades table to avoid overflow
ALTER TABLE public.trades
  ALTER COLUMN entry_price TYPE DECIMAL(15,5) USING entry_price::DECIMAL(15,5),
  ALTER COLUMN exit_price TYPE DECIMAL(15,5) USING exit_price::DECIMAL(15,5),
  ALTER COLUMN lot_size TYPE DECIMAL(15,2) USING lot_size::DECIMAL(15,2),
  ALTER COLUMN pnl TYPE DECIMAL(15,2) USING pnl::DECIMAL(15,2); 