-- PostgreSQL Schema for Doctor Appointment System

/*
  Drop existing views, tables and types (safe, idempotent) so this file
  can be used to fully reset the schema before applying the updated
  software schema. Run this in the Supabase SQL editor or psql.
*/
BEGIN;

-- Drop views
DROP VIEW IF EXISTS doctor_stats CASCADE;
DROP VIEW IF EXISTS payment_analytics CASCADE;

-- Drop tables (order matters because of foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctor_breaktimes CASCADE;
DROP TABLE IF EXISTS doctor_availability CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS specialization CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

COMMIT;


-- Create ENUM types
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'cryptocurrency');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');
CREATE TYPE specialization AS ENUM (
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Surgery',
  'Internal Medicine',
  'Ophthalmology'
);

-- Users table (extended from Supabase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role user_role NOT NULL DEFAULT 'patient',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender VARCHAR(20),
  address JSONB, -- {street, city, state, zip_code}
  emergency_contact JSONB, -- {name, phone_number, relationship}
  medical_history TEXT[],
  allergies TEXT[],
  insurance_provider VARCHAR(100),
  insurance_number VARCHAR(100),
  preferred_doctor_id UUID REFERENCES users(id),
  total_appointments INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  specialization specialization NOT NULL,
  years_of_experience INTEGER,
  hospital VARCHAR(200),
  department VARCHAR(100),
  bio TEXT,
  education JSONB[], -- [{degree, institution, year}]
  consultation_fee DECIMAL(10, 2) NOT NULL,
  consultation_duration INTEGER DEFAULT 30, -- in minutes
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  total_patients INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  -- Bank Account Details
  account_number VARCHAR(100),
  bank_name VARCHAR(100),
  account_name VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor availability
CREATE TABLE doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor breaktimes/leaves
CREATE TABLE doctor_breaktimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  status appointment_status DEFAULT 'scheduled',
  reason TEXT,
  consultation_fee DECIMAL(10, 2),
  notes TEXT,
  is_locked BOOLEAN DEFAULT FALSE,
  lock_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  transaction_id VARCHAR(255) UNIQUE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Cash payment details
  cash_received_by VARCHAR(100),
  cash_receipt_number VARCHAR(100),
  
  -- Bank transfer details
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(100),
  bank_transaction_reference VARCHAR(255),
  bank_proof_image_url TEXT,
  bank_verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  bank_verified_by UUID REFERENCES users(id),
  bank_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Cryptocurrency details
  crypto_coin_type VARCHAR(50), -- BTC, ETH, USDT
  crypto_wallet_address VARCHAR(255),
  crypto_transaction_hash VARCHAR(255),
  crypto_amount DECIMAL(18, 8),
  crypto_exchange_rate DECIMAL(18, 2),
  crypto_confirmations INTEGER DEFAULT 0,
  
  -- Card details
  card_last_4_digits VARCHAR(4),
  card_brand VARCHAR(50),
  card_expiry_date VARCHAR(5),
  
  -- Commission tracking
  commission DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50)
);

-- Ratings/Reviews
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating DECIMAL(3, 2) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50), -- appointment_reminder, payment_confirmation, etc.
  is_read BOOLEAN DEFAULT FALSE,
  related_appointment_id UUID REFERENCES appointments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_preferred_doctor ON patients(preferred_doctor_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_is_available ON doctors(is_available);
CREATE INDEX idx_availability_doctor_id ON doctor_availability(doctor_id);
CREATE INDEX idx_breaktimes_doctor_id ON doctor_breaktimes(doctor_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX idx_appointments_lock ON appointments(is_locked, lock_expires_at);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_payments_doctor_id ON payments(doctor_id);
CREATE INDEX idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_ratings_doctor_id ON ratings(doctor_id);
CREATE INDEX idx_ratings_patient_id ON ratings(patient_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- Create views for common queries
CREATE VIEW doctor_stats AS
SELECT 
  d.id,
  u.first_name,
  u.last_name,
  d.specialization,
  COUNT(a.id) as total_appointments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
  AVG(r.rating) as average_rating,
  COUNT(DISTINCT a.patient_id) as total_patients
FROM doctors d
LEFT JOIN users u ON d.id = u.id
LEFT JOIN appointments a ON d.id = a.doctor_id
LEFT JOIN ratings r ON d.id = r.doctor_id
GROUP BY d.id, u.first_name, u.last_name, d.specialization;

CREATE VIEW payment_analytics AS
SELECT
  DATE(p.created_at) as payment_date,
  p.payment_method,
  p.payment_status,
  COUNT(*) as count,
  SUM(p.amount) as total_amount,
  AVG(p.amount) as average_amount
FROM payments p
GROUP BY DATE(p.created_at), p.payment_method, p.payment_status;

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own data
CREATE POLICY users_select_own ON users
FOR SELECT USING (auth.uid() = id);

-- Patients can view their own data
CREATE POLICY patients_select_own ON patients
FOR SELECT USING (auth.uid() = id);

-- Doctors can view their own data
CREATE POLICY doctors_select_own ON doctors
FOR SELECT USING (auth.uid() = id);

-- Everyone can view available doctors (public read)
CREATE POLICY doctors_select_public ON doctors
FOR SELECT USING (is_available = TRUE);

-- Patients can view their own appointments
CREATE POLICY appointments_select_own ON appointments
FOR SELECT USING (auth.uid() = patient_id);

-- Doctors can view their appointments
CREATE POLICY appointments_select_doctor ON appointments
FOR SELECT USING (auth.uid() = doctor_id);

-- Patients can view their own payments
CREATE POLICY payments_select_own ON payments
FOR SELECT USING (auth.uid() = patient_id);

-- Notifications policies
CREATE POLICY notifications_select_own ON notifications
FOR SELECT USING (auth.uid() = user_id);
