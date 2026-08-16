import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
// Prefer VITE_SUPABASE_ANON_KEY; also accept VITE_SUPABASE_KEY (common mistype)
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY ||
  ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const INITIAL_DEMO_EXPENSES = [
  {
    id: "1",
    merchant: "M/S.SACHKHAND FOUND",
    amount: 500.00,
    currency: "INR",
    category: "Donation/Charity",
    account_no: "XX3065",
    raw_info: "UPI/P2M/657080037142/M/S.SACHKHAND FOUND",
    transaction_date: "2026-07-23T15:34:43.000Z"
  },
  {
    id: "2",
    merchant: "Swiggy Food Order",
    amount: 349.00,
    currency: "INR",
    category: "Food & Dining",
    account_no: "XX3065",
    raw_info: "UPI/P2M/SWIGGY/PAY",
    transaction_date: "2026-07-24T20:15:00.000Z"
  },
  {
    id: "3",
    merchant: "Uber Ride",
    amount: 210.50,
    currency: "INR",
    category: "Transport",
    account_no: "XX3065",
    raw_info: "UPI/P2M/UBER/TRIP",
    transaction_date: "2026-07-25T09:40:12.000Z"
  },
  {
    id: "4",
    merchant: "Electricity Bill (Adani)",
    amount: 1450.00,
    currency: "INR",
    category: "Bills & Utilities",
    account_no: "XX3065",
    raw_info: "NEFT/ADANI_POWER",
    transaction_date: "2026-07-26T11:20:00.000Z"
  },
  {
    id: "5",
    merchant: "Amazon India",
    amount: 899.00,
    currency: "INR",
    category: "Shopping",
    account_no: "XX3065",
    raw_info: "CARD/AMAZON_SELLER",
    transaction_date: "2026-07-27T16:05:30.000Z"
  }
]
