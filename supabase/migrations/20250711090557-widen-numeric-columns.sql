-- Widen numeric columns in the trades table to prevent overflow errors

ALTER TABLE public.trades
  ALTER COLUMN pnl TYPE NUMERIC(20, 5),
  ALTER COLUMN entry_price TYPE NUMERIC(20, 5),
  ALTER COLUMN exit_price TYPE NUMERIC(20, 5),
  ALTER COLUMN commission TYPE NUMERIC(20, 5),
  ALTER COLUMN profit TYPE NUMERIC(20, 5),
  ALTER COLUMN deposit TYPE NUMERIC(20, 5),
  ALTER COLUMN withdrawal TYPE NUMERIC(20, 5);
