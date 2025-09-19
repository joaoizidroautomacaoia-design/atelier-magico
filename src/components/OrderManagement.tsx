import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FileText, DollarSign, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

interface OrderService {
  serviceId: string;
  serviceName: string;
  price: number;
  observation: string;
}

interface Order {
  id: string;
  client_id: string;
  discount: number;
  total: number;
  general_observations: string;
  created_at: string;
  updated_at?: string;
  clients?: Client;
  order_services?: Array<{
    id: string;
    service_id: string;
    observations: string;
    services: Service;
  }>;
}

const OrderManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    services: [] as OrderService[],
    discount: 0,
    generalObservations: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientsData, servicesData, ordersData] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('orders').select(`
          *,
          clients(id, name, phone),
          order_services(
            id,
            service_id,
            observations,
            services(id, name, price)
          )
        `).order('created_at', { ascending: false })
      ]);

      if (clientsData.error) throw clientsData.error;
      if (servicesData.error) throw servicesData.error;
      if (ordersData.error) throw ordersData.error;

      setClients(clientsData.data || []);
      setServices(servicesData.data || []);
      setOrders(ordersData.data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (orderServices: OrderService[], discount: number) => {
    const subtotal = orderServices.reduce((sum, service) => sum + service.price, 0);
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || formData.services.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um cliente e adicione pelo menos um serviço.",
        variant: "destructive",
      });
      return;
    }

    const total = calculateTotal(formData.services, formData.discount);

    try {
      if (editingOrder) {
        // Update order
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            client_id: formData.clientId,
            discount: formData.discount,
            total,
            general_observations: formData.generalObservations,
          })
          .eq('id', editingOrder.id);

        if (orderError) throw orderError;

        // Delete existing order services
        const { error: deleteError } = await supabase
          .from('order_services')
          .delete()
          .eq('order_id', editingOrder.id);

        if (deleteError) throw deleteError;

        // Insert new order services
        const orderServices = formData.services.map(service => ({
          order_id: editingOrder.id,
          service_id: service.serviceId,
          observations: service.observation,
        }));

        const { error: insertError } = await supabase
          .from('order_services')
          .insert(orderServices);

        if (insertError) throw insertError;

        toast({
          title: "Sucesso",
          description: "Pedido editado com sucesso!",
        });
      } else {
        // Create new order
        const { data: { user } } = await supabase.auth.getUser();
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            client_id: formData.clientId,
            discount: formData.discount,
            total,
            general_observations: formData.generalObservations,
            user_id: user?.id,
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order services
        const orderServices = formData.services.map(service => ({
          order_id: orderData.id,
          service_id: service.serviceId,
          observations: service.observation,
        }));

        const { error: servicesError } = await supabase
          .from('order_services')
          .insert(orderServices);

        if (servicesError) throw servicesError;

        toast({
          title: "Sucesso",
          description: "Pedido cadastrado com sucesso!",
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar pedido.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: "",
      services: [],
      discount: 0,
      generalObservations: "",
    });
    setEditingOrder(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      clientId: order.client_id,
      services: order.order_services?.map(os => ({
        serviceId: os.service_id,
        serviceName: os.services.name,
        price: os.services.price,
        observation: os.observations || "",
      })) || [],
      discount: order.discount,
      generalObservations: order.general_observations || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pedido excluído com sucesso!",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir pedido.",
        variant: "destructive",
      });
    }
  };

  const openNewDialog = () => {
    setEditingOrder(null);
    setFormData({
      clientId: "",
      services: [],
      discount: 0,
      generalObservations: "",
    });
    setIsDialogOpen(true);
  };

  const addService = () => {
    if (formData.services.length >= 10) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 10 serviços por pedido.",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      services: [...formData.services, { serviceId: "", serviceName: "", price: 0, observation: "" }],
    });
  };

  const removeService = (index: number) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index),
    });
  };

  const updateService = (index: number, field: keyof OrderService, value: string | number) => {
    const updatedServices = [...formData.services];
    
    if (field === "serviceId") {
      const selectedService = services.find(s => s.id === value);
      if (selectedService) {
        updatedServices[index] = {
          ...updatedServices[index],
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          price: selectedService.price,
        };
      }
    } else {
      updatedServices[index] = { ...updatedServices[index], [field]: value };
    }
    
    setFormData({ ...formData, services: updatedServices });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const subtotal = formData.services.reduce((sum, service) => sum + service.price, 0);
  const discountAmount = (subtotal * formData.discount) / 100;
  const total = subtotal - discountAmount;

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Gestão de Pedidos
              </CardTitle>
              <CardDescription>
                Crie e gerencie pedidos dos seus clientes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} className="bg-gradient-primary hover:opacity-90 transition-smooth">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pedido
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrder ? "Editar Pedido" : "Novo Pedido"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrder 
                      ? "Edite as informações do pedido aqui." 
                      : "Crie um novo pedido selecionando cliente e serviços."
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedClient && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Telefone: {selectedClient.phone}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Serviços</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addService}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Serviço
                      </Button>
                    </div>
                    
                    {formData.services.map((service, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Serviço {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Serviço</Label>
                            <Select 
                              value={service.serviceId} 
                              onValueChange={(value) => updateService(index, "serviceId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um serviço" />
                              </SelectTrigger>
                              <SelectContent>
                                {services.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name} - {formatCurrency(s.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Preço</Label>
                            <Input
                              value={formatCurrency(service.price)}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Observações</Label>
                          <Textarea
                            value={service.observation}
                            onChange={(e) => updateService(index, "observation", e.target.value)}
                            placeholder="Observações específicas para este serviço..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {formData.services.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Nenhum serviço adicionado</p>
                        <p className="text-sm">Clique em "Adicionar Serviço" para começar</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount">Desconto (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input
                        value={formatCurrency(total)}
                        disabled
                        className="bg-muted font-bold text-lg"
                      />
                    </div>
                  </div>

                  {formData.services.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {formData.discount > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span>Desconto ({formData.discount}%):</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="generalObservations">Observações Gerais</Label>
                    <Textarea
                      id="generalObservations"
                      value={formData.generalObservations}
                      onChange={(e) => setFormData({ ...formData, generalObservations: e.target.value })}
                      placeholder="Observações gerais do pedido (ex: tecido fornecido pelo cliente, prazo especial...)"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                      {editingOrder ? "Salvar" : "Criar Pedido"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Carregando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum pedido cadastrado</p>
              <p className="text-sm">Comece criando seu primeiro pedido</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-smooth">
                      <TableCell className="font-medium">{order.clients?.name}</TableCell>
                      <TableCell>{order.clients?.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {order.order_services?.map((os, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {os.services.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(order)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;