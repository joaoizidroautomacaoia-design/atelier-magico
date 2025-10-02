import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Scissors, FileText, Plus, LogOut, Settings, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/Dashboard";
import ClientManagement from "@/components/ClientManagement";
import ServiceManagement from "@/components/ServiceManagement";
import PixSettings from "@/components/PixSettings";
import OrderManagement from "@/components/OrderManagementNew";

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'settings' | 'orders'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                Ateliê Celia Severo
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                Sistema de gestão para seu ateliê de costura.
              </p>
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-2"
            >
              <Menu className="w-4 h-4" />
            </Button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <div className="flex items-center gap-2">
                {user.user_metadata?.avatar_url && (
                  <img 
                    src={user.user_metadata?.avatar_url} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium hidden lg:inline">{user.user_metadata?.full_name}</span>
              </div>
              <nav className="flex space-x-1 lg:space-x-2">
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('dashboard')}
                  size="sm"
                  className="transition-smooth text-xs lg:text-sm"
                >
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'clients' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('clients')}
                  size="sm"
                  className="transition-smooth text-xs lg:text-sm"
                >
                  Clientes
                </Button>
                <Button
                  variant={activeTab === 'orders' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('orders')}
                  size="sm"
                  className="transition-smooth text-xs lg:text-sm"
                >
                  Pedidos
                </Button>
                <Button
                  variant={activeTab === 'settings' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('settings')}
                  size="sm"
                  className="transition-smooth text-xs lg:text-sm"
                >
                  Configurações
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

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-3 flex justify-center gap-2 animate-fade-in">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                size="icon"
                className="h-12 w-12"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                variant={activeTab === 'clients' ? 'default' : 'outline'}
                onClick={() => { setActiveTab('clients'); setMobileMenuOpen(false); }}
                size="icon"
                className="h-12 w-12"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'outline'}
                onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }}
                size="icon"
                className="h-12 w-12"
              >
                <FileText className="h-5 w-5" />
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'outline'}
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                size="icon"
                className="h-12 w-12"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={signOut}
                size="icon"
                className="h-12 w-12"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 md:py-8">
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

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
                <TabsTrigger value="services" className="text-xs sm:text-sm md:text-base">Serviços</TabsTrigger>
                <TabsTrigger value="pix" className="text-xs sm:text-sm md:text-base">Chave Pix</TabsTrigger>
              </TabsList>
              <TabsContent value="services">
                <ServiceManagement />
              </TabsContent>
              <TabsContent value="pix">
                <PixSettings />
              </TabsContent>
            </Tabs>
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