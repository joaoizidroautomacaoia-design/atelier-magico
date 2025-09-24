import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Scissors, FileText, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/Dashboard";
import ClientManagement from "@/components/ClientManagement";
import ServiceManagement from "@/components/ServiceManagement";
import OrderManagement from "@/components/OrderManagementNew";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'services' | 'orders'>('dashboard');
  const [stats, setStats] = useState([
    { title: "Clientes", value: "0", icon: Users, color: "bg-gradient-primary" },
    { title: "Serviços", value: "0", icon: Scissors, color: "bg-gradient-secondary" },
    { title: "Pedidos", value: "0", icon: FileText, color: "bg-gradient-accent" },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        const [clientsData, servicesData, ordersData] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact' }),
          supabase.from('services').select('*', { count: 'exact' }),
          supabase.from('orders').select('*', { count: 'exact' })
        ]);

        setStats([
          { title: "Clientes", value: clientsData.count?.toString() || "0", icon: Users, color: "bg-gradient-primary" },
          { title: "Serviços", value: servicesData.count?.toString() || "0", icon: Scissors, color: "bg-gradient-secondary" },
          { title: "Pedidos", value: ordersData.count?.toString() || "0", icon: FileText, color: "bg-gradient-accent" },
        ]);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-accent">
      <header className="bg-white shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Ateliê Celia Severo.
              </h1>
              <p className="text-muted-foreground mt-1">
                Sistema de gestão para seu ateliê de costura
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src={user.user_metadata?.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{user.user_metadata?.full_name}</span>
              </div>
              <nav className="flex space-x-2">
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('dashboard')}
                  className="transition-smooth"
                >
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'clients' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('clients')}
                  className="transition-smooth"
                >
                  Clientes
                </Button>
                <Button
                  variant={activeTab === 'services' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('services')}
                  className="transition-smooth"
                >
                  Serviços
                </Button>
                <Button
                  variant={activeTab === 'orders' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('orders')}
                  className="transition-smooth"
                >
                  Pedidos
                </Button>
              </nav>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="transition-smooth"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <Dashboard />
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="animate-fade-in">
            <ClientManagement />
          </div>
        )}

        {activeTab === 'services' && (
          <div className="animate-fade-in">
            <ServiceManagement />
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="animate-fade-in">
            <OrderManagement />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;