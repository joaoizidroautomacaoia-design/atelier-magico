-- Add user_id columns to isolate data per user
ALTER TABLE public.clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing policies to filter by user_id
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clients;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.clients;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.clients;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.clients;

CREATE POLICY "Users can view their own clients" ON public.clients
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" ON public.clients
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON public.clients
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON public.clients
FOR DELETE USING (auth.uid() = user_id);

-- Services policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.services;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.services;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.services;

CREATE POLICY "Users can view their own services" ON public.services
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own services" ON public.services
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON public.services
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON public.services
FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" ON public.orders
FOR DELETE USING (auth.uid() = user_id);

-- Order services policies (through orders relationship)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.order_services;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.order_services;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.order_services;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.order_services;

CREATE POLICY "Users can view order services for their orders" ON public.order_services
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_services.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create order services for their orders" ON public.order_services
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_services.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update order services for their orders" ON public.order_services
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_services.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete order services for their orders" ON public.order_services
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_services.order_id 
    AND orders.user_id = auth.uid()
  )
);