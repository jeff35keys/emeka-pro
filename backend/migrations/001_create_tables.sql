-- Create Tables for Doctor Appointment System
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (managed by Supabase Auth + custom fields)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT CHECK (role IN ('patient', 'doctor', 'admin')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Patients Table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_history TEXT[],
  allergies TEXT[],
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  total_appointments INT DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Doctors Table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  specialization TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  years_of_experience INT,
  hospital TEXT,
  department TEXT,
  bio TEXT,
  education TEXT[],
  consultation_fee DECIMAL(10, 2) NOT NULL,
  consultation_duration INT DEFAULT 30,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INT DEFAULT 0,
  total_patients INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Doctor Availability Table
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  day_of_week TEXT CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(doctor_id, day_of_week)
);

-- Doctor Breaktimes Table
CREATE TABLE public.doctor_breaktimes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Appointments Table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INT DEFAULT 30,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled')) DEFAULT 'scheduled',
  reason TEXT,
  consultation_fee DECIMAL(10, 2),
  notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  lock_expires_at TIMESTAMP WITH TIME ZONE,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Payments Table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'cryptocurrency', 'credit_card')) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  transaction_id TEXT UNIQUE,
  
  -- Cash Payment Details
  cash_received_by TEXT,
  cash_received_at TIMESTAMP WITH TIME ZONE,
  cash_receipt_number TEXT,
  
  -- Bank Transfer Details
  bank_name TEXT,
  bank_account_number TEXT,
  bank_transaction_reference TEXT,
  bank_proof_image_url TEXT,
  bank_verification_status TEXT CHECK (bank_verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  bank_verified_by UUID REFERENCES public.users(id),
  bank_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Cryptocurrency Details
  crypto_coin_type TEXT,
  crypto_wallet_address TEXT,
  crypto_transaction_hash TEXT,
  crypto_amount_in_crypto DECIMAL(18, 8),
  crypto_exchange_rate DECIMAL(12, 6),
  crypto_confirmations INT DEFAULT 0,
  
  -- Credit Card Details
  card_last_4_digits TEXT,
  card_brand TEXT,
  card_expiry_date TEXT,
  
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_patients_user_id ON public.patients(id);
CREATE INDEX idx_doctors_user_id ON public.doctors(id);
CREATE INDEX idx_doctors_specialization ON public.doctors(specialization);
CREATE INDEX idx_doctors_is_available ON public.doctors(is_available);
CREATE INDEX idx_doctor_availability_doctor_id ON public.doctor_availability(doctor_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_lock ON public.appointments(is_locked, lock_expires_at);
CREATE INDEX idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_method ON public.payments(payment_method);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id);

-- Create Functions
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_breaktimes ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Patients can view their own record
CREATE POLICY "Patients can view own record"
  ON public.patients FOR SELECT
  USING (auth.uid() = id);

-- Doctors can view their own record
CREATE POLICY "Doctors can view own record"
  ON public.doctors FOR SELECT
  USING (auth.uid() = id);

-- Everyone can view available doctors
CREATE POLICY "Everyone can view available doctors"
  ON public.doctors FOR SELECT
  USING (is_available = true);

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can view their appointments
CREATE POLICY "Doctors can view their appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = doctor_id);

-- Patients can view their own payments
CREATE POLICY "Patients can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = patient_id);

-- Doctors can view their payments
CREATE POLICY "Doctors can view their payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = doctor_id);
