import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Scissors, FileText, Plus } from "lucide-react";
import ClientManagement from "@/components/ClientManagement";
import ServiceManagement from "@/components/ServiceManagement";
import OrderManagement from "@/components/OrderManagement";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'services' | 'orders'>('dashboard');

  const stats = [
    { title: "Clientes", value: "0", icon: Users, color: "bg-gradient-primary" },
    { title: "Serviços", value: "0", icon: Scissors, color: "bg-gradient-secondary" },
    { title: "Pedidos", value: "0", icon: FileText, color: "bg-gradient-accent" },
  ];

  return (
    <div className="min-h-screen bg-gradient-accent">
      <header className="bg-white shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Ateliê Manager
              </h1>
              <p className="text-muted-foreground mt-1">
                Sistema de gestão para seu ateliê de costura
              </p>
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={stat.title} className="shadow-card hover:shadow-elegant transition-smooth">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.color} p-2 rounded-lg`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer" 
                    onClick={() => setActiveTab('clients')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Gestão de Clientes
                  </CardTitle>
                  <CardDescription>
                    Cadastre e gerencie informações dos seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerenciar Clientes
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer" 
                    onClick={() => setActiveTab('services')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-primary" />
                    Gestão de Serviços
                  </CardTitle>
                  <CardDescription>
                    Cadastre os serviços e valores do seu ateliê
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerenciar Serviços
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer" 
                    onClick={() => setActiveTab('orders')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Gestão de Pedidos
                  </CardTitle>
                  <CardDescription>
                    Crie e acompanhe os pedidos dos clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Gerenciar Pedidos
                  </Button>
                </CardContent>
              </Card>
            </div>
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