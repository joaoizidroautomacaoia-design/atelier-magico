-- Add status column to orders table
ALTER TABLE public.orders 
ADD COLUMN status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'pronto', 'entregue'));

-- Update existing orders to have default status
UPDATE public.orders SET status = 'pendente' WHERE status IS NULL;