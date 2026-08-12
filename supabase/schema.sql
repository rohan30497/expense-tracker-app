-- Supabase Database Schema for Expense Tracker

-- 1. Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    merchant VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Other',
    account_no VARCHAR(50),
    raw_info TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on category and date for fast query performance
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(transaction_date DESC);

-- 3. Enable Row Level Security (RLS) and allow anon read/insert for dashboard
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.expenses
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.expenses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.expenses
    FOR UPDATE USING (true);

-- 4. Add table to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
