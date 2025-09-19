import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Scissors, FileText, DollarSign, Plus, Clock, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";

interface DashboardStats {
  totalClients: number;
  totalServices: number;
  totalOrders: number;
  monthlyRevenue: number;
  monthlyReceived: number;
  monthlyPending: number;
  averageTicket: number;
  dailyOrders: { count: number; total: number };
  topClient: string;
  newClientsMonth: number;
  topService: string;
  monthlyServicesCount: number;
  overdueOrders: number;
}

interface ChartData {
  serviceRevenue: Array<{ name: string; value: number; fill: string }>;
  monthlyEvolution: Array<{ month: string; orders: number }>;
  paymentStatus: Array<{ name: string; value: number; fill: string }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalServices: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    monthlyReceived: 0,
    monthlyPending: 0,
    averageTicket: 0,
    dailyOrders: { count: 0, total: 0 },
    topClient: "N/A",
    newClientsMonth: 0,
    topService: "N/A",
    monthlyServicesCount: 0,
    overdueOrders: 0
  });

  const [chartData, setChartData] = useState<ChartData>({
    serviceRevenue: [],
    monthlyEvolution: [],
    paymentStatus: []
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
      const startOfMonth = `${currentMonth}-01`;
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
      const todayStr = today.toISOString().slice(0, 10);

      // Basic counts
      const [clientsData, servicesData, ordersData] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact' }),
        supabase.from('services').select('*', { count: 'exact' }),
        supabase.from('orders').select('*', { count: 'exact' })
      ]);

      // Monthly orders and revenue
      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('*, clients(name)')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      // Daily orders
      const { data: dailyOrdersData } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', todayStr)
        .lt('created_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10));

      // Recent orders
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // Service revenue data
      const { data: serviceRevenueData } = await supabase
        .from('order_services')
        .select('services(name), orders(total)')
        .gte('created_at', startOfMonth);

      // Calculate statistics
      const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const monthlyReceived = monthlyOrders?.filter(order => order.payment_status === 'pago').reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const monthlyPending = monthlyRevenue - monthlyReceived;
      const averageTicket = monthlyOrders?.length ? monthlyRevenue / monthlyOrders.length : 0;

      const dailyTotal = dailyOrdersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Top client calculation
      const clientOrderCounts = monthlyOrders?.reduce((acc: any, order) => {
        const clientName = order.clients?.name || 'Cliente desconhecido';
        acc[clientName] = (acc[clientName] || 0) + (order.total || 0);
        return acc;
      }, {});
      
      const topClient = clientOrderCounts ? Object.keys(clientOrderCounts).reduce((a, b) => 
        clientOrderCounts[a] > clientOrderCounts[b] ? a : b, Object.keys(clientOrderCounts)[0] || "N/A") : "N/A";

      // New clients this month
      const { count: newClientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .gte('created_at', startOfMonth);

      // Service statistics
      const serviceStats = serviceRevenueData?.reduce((acc: any, item) => {
        const serviceName = item.services?.name || 'Serviço desconhecido';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {});

      const topService = serviceStats ? Object.keys(serviceStats).reduce((a, b) => 
        serviceStats[a] > serviceStats[b] ? a : b, Object.keys(serviceStats)[0] || "N/A") : "N/A";

      // Overdue orders (unpaid for more than 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: overdueCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('payment_status', 'não pago')
        .lt('created_at', weekAgo);

      // Chart data preparation
      const serviceRevenueChart = Object.entries(serviceStats || {}).map(([name, count], index) => ({
        name,
        value: count as number,
        fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
      }));

      const paymentStatusChart = [
        { name: 'Pagos', value: monthlyReceived, fill: 'hsl(142, 76%, 36%)' },
        { name: 'Pendentes', value: monthlyPending, fill: 'hsl(346, 87%, 43%)' }
      ];

      // Mock monthly evolution (you can enhance this with actual historical data)
      const monthlyEvolutionChart = [
        { month: 'Jan', orders: 12 },
        { month: 'Fev', orders: 19 },
        { month: 'Mar', orders: 15 },
        { month: 'Abr', orders: 22 },
        { month: 'Mai', orders: 18 },
        { month: 'Jun', orders: monthlyOrders?.length || 0 }
      ];

      setStats({
        totalClients: clientsData.count || 0,
        totalServices: servicesData.count || 0,
        totalOrders: ordersData.count || 0,
        monthlyRevenue,
        monthlyReceived,
        monthlyPending,
        averageTicket,
        dailyOrders: { count: dailyOrdersData?.length || 0, total: dailyTotal },
        topClient,
        newClientsMonth: newClientsCount || 0,
        topService,
        monthlyServicesCount: serviceRevenueData?.length || 0,
        overdueOrders: overdueCount || 0
      });

      setChartData({
        serviceRevenue: serviceRevenueChart,
        monthlyEvolution: monthlyEvolutionChart,
        paymentStatus: paymentStatusChart
      });

      setRecentOrders(recentOrdersData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const chartConfig = {
    revenue: { label: "Receita", color: "hsl(var(--primary))" },
    orders: { label: "Pedidos", color: "hsl(var(--primary))" }
  };

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral do seu ateliê</p>
        </div>
        {/*<Button className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>*/}
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.monthlyPending.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Status de Pagamento</CardTitle>
            <CardDescription>Proporção de pagos vs não pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.paymentStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {chartData.paymentStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
            <CardDescription>5 pedidos mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{order.clients?.name || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {order.total?.toFixed(2)}</p>
                    <p className={`text-sm ${order.payment_status === 'pago' ? 'text-green-600' : 'text-red-600'}`}>
                      {order.payment_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Highlights and Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Cliente Destaque</CardTitle>
            <CardDescription>Maior faturamento no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.topClient}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Serviço Destaque</CardTitle>
            <CardDescription>Mais solicitado no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.topService}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Atenção necessária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{stats.dailyOrders.count} pedidos hoje</span>
              </div>
              {stats.overdueOrders > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{stats.overdueOrders} clientes em atraso</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
