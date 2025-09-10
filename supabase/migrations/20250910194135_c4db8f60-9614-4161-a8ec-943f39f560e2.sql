-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  discount DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  general_observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_services table (many-to-many relationship between orders and services)
CREATE TABLE public.order_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_services ENABLE ROW LEVEL SECURITY;

-- Create public access policies (since there's no authentication yet)
CREATE POLICY "Enable read access for all users" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.services FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.services FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.services FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.orders FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.order_services FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.order_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.order_services FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.order_services FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();