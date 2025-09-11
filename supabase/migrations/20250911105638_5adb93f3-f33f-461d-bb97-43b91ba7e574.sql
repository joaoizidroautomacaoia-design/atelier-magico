-- Add payment_status and confirmed columns to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_status TEXT DEFAULT 'não pago' CHECK (payment_status IN ('pago', 'não pago')),
ADD COLUMN confirmed BOOLEAN DEFAULT false;

-- Add garment_name column to order_services table for grouping services by clothing piece
ALTER TABLE public.order_services 
ADD COLUMN garment_name TEXT;

-- Add individual_discount column to order_services for per-service discounts
ALTER TABLE public.order_services 
ADD COLUMN individual_discount NUMERIC DEFAULT 0;