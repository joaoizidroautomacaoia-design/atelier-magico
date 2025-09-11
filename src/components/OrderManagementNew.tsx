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
import { Plus, Edit, Trash2, FileText, X, Check } from "lucide-react";
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

interface GarmentService {
  serviceId: string;
  serviceName: string;
  price: number;
  individualDiscount: number;
  observation: string;
}

interface Garment {
  name: string;
  services: GarmentService[];
}

interface Order {
  id: string;
  client_id: string;
  discount: number;
  total: number;
  general_observations: string;
  payment_status: string;
  confirmed: boolean;
  created_at: string;
  updated_at?: string;
  clients?: Client;
  order_services?: Array<{
    id: string;
    service_id: string;
    garment_name: string;
    individual_discount: number;
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
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [existingClient, setExistingClient] = useState<Client | null>(null);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [discount, setDiscount] = useState(0);
  const [generalObservations, setGeneralObservations] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("não pago");
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
            garment_name,
            individual_discount,
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

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove +55 if present at the beginning
    if (cleaned.startsWith('55') && cleaned.length > 11) {
      cleaned = cleaned.substring(2);
    }
    
    // Format to 11999999999
    return cleaned;
  };

  const handleClientNameChange = (name: string) => {
    setClientName(name);
    
    if (name.length > 2) {
      const foundClient = clients.find(client => 
        client.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (foundClient) {
        setExistingClient(foundClient);
        setClientPhone(foundClient.phone);
      } else {
        setExistingClient(null);
      }
    } else {
      setExistingClient(null);
    }
  };

  const handlePhoneChange = (phone: string) => {
    const formatted = formatPhoneNumber(phone);
    setClientPhone(formatted);
  };

  const addGarment = () => {
    setGarments([...garments, { name: "", services: [] }]);
  };

  const removeGarment = (index: number) => {
    setGarments(garments.filter((_, i) => i !== index));
  };

  const updateGarmentName = (index: number, name: string) => {
    const updated = [...garments];
    updated[index].name = name;
    setGarments(updated);
  };

  const addServiceToGarment = (garmentIndex: number) => {
    const updated = [...garments];
    updated[garmentIndex].services.push({
      serviceId: "",
      serviceName: "",
      price: 0,
      individualDiscount: 0,
      observation: ""
    });
    setGarments(updated);
  };

  const removeServiceFromGarment = (garmentIndex: number, serviceIndex: number) => {
    const updated = [...garments];
    updated[garmentIndex].services.splice(serviceIndex, 1);
    setGarments(updated);
  };

  const updateGarmentService = (garmentIndex: number, serviceIndex: number, field: keyof GarmentService, value: string | number) => {
    const updated = [...garments];
    
    if (field === "serviceId") {
      const selectedService = services.find(s => s.id === value);
      if (selectedService) {
        updated[garmentIndex].services[serviceIndex] = {
          ...updated[garmentIndex].services[serviceIndex],
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          price: selectedService.price,
        };
      }
    } else {
      updated[garmentIndex].services[serviceIndex] = {
        ...updated[garmentIndex].services[serviceIndex],
        [field]: value
      };
    }
    
    setGarments(updated);
  };

  const calculateServiceTotal = (service: GarmentService) => {
    const discountAmount = (service.price * service.individualDiscount) / 100;
    return service.price - discountAmount;
  };

  const calculateTotal = () => {
    const subtotal = garments.reduce((total, garment) => {
      return total + garment.services.reduce((garmentTotal, service) => {
        return garmentTotal + calculateServiceTotal(service);
      }, 0);
    }, 0);
    
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim() || !clientPhone.trim() || garments.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const hasValidGarments = garments.some(garment => 
      garment.name.trim() && garment.services.length > 0
    );

    if (!hasValidGarments) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma peça com serviços.",
        variant: "destructive",
      });
      return;
    }

    try {
      let clientId = existingClient?.id;

      // Create client if doesn't exist
      if (!existingClient) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{ name: clientName, phone: clientPhone }])
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      const total = calculateTotal();

      if (editingOrder) {
        // Update order
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            client_id: clientId,
            discount,
            total,
            general_observations: generalObservations,
            payment_status: paymentStatus,
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
        const orderServices = garments.flatMap(garment =>
          garment.services.map(service => ({
            order_id: editingOrder.id,
            service_id: service.serviceId,
            garment_name: garment.name,
            individual_discount: service.individualDiscount,
            observations: service.observation,
          }))
        );

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
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            client_id: clientId,
            discount,
            total,
            general_observations: generalObservations,
            payment_status: paymentStatus,
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order services
        const orderServices = garments.flatMap(garment =>
          garment.services.map(service => ({
            order_id: orderData.id,
            service_id: service.serviceId,
            garment_name: garment.name,
            individual_discount: service.individualDiscount,
            observations: service.observation,
          }))
        );

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
    setClientName("");
    setClientPhone("");
    setExistingClient(null);
    setGarments([]);
    setDiscount(0);
    setGeneralObservations("");
    setPaymentStatus("não pago");
    setEditingOrder(null);
    setIsDialogOpen(false);
  };

  const confirmOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ confirmed: true })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pedido confirmado!",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar pedido.",
        variant: "destructive",
      });
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTodaysOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(order => 
      new Date(order.created_at).toDateString() === today
    );
  };

  const todaysOrders = getTodaysOrders();

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
                Crie e gerencie pedidos dos seus clientes - Exibindo pedidos de hoje
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-primary hover:opacity-90 transition-smooth">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pedido
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Pedido</DialogTitle>
                  <DialogDescription>
                    Crie um novo pedido selecionando cliente e serviços.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Nome do Cliente</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => handleClientNameChange(e.target.value)}
                        placeholder="Digite o nome do cliente..."
                        required
                      />
                      {existingClient && (
                        <p className="text-sm text-green-600">
                          Cliente encontrado: {existingClient.name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clientPhone">Telefone</Label>
                      <Input
                        id="clientPhone"
                        value={clientPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="11999999999"
                        required
                        disabled={!!existingClient}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Peças de Roupa e Serviços</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addGarment}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Peça
                      </Button>
                    </div>
                    
                    {garments.map((garment, garmentIndex) => (
                      <div key={garmentIndex} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <Label>Nome da Peça</Label>
                            <Input
                              value={garment.name}
                              onChange={(e) => updateGarmentName(garmentIndex, e.target.value)}
                              placeholder="Ex: Calça azul, Vestido longo..."
                              required
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGarment(garmentIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Serviços</Label>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addServiceToGarment(garmentIndex)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Serviço
                            </Button>
                          </div>

                          {garment.services.map((service, serviceIndex) => (
                            <div key={serviceIndex} className="p-3 bg-muted rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Serviço {serviceIndex + 1}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeServiceFromGarment(garmentIndex, serviceIndex)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label>Serviço</Label>
                                  <Select 
                                    value={service.serviceId} 
                                    onValueChange={(value) => updateGarmentService(garmentIndex, serviceIndex, "serviceId", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
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
                                
                                <div className="space-y-1">
                                  <Label>Preço</Label>
                                  <Input
                                    value={formatCurrency(service.price)}
                                    disabled
                                    className="bg-background"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <Label>Desconto (%)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={service.individualDiscount}
                                    onChange={(e) => updateGarmentService(garmentIndex, serviceIndex, "individualDiscount", parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <Label>Observações</Label>
                                <Textarea
                                  value={service.observation}
                                  onChange={(e) => updateGarmentService(garmentIndex, serviceIndex, "observation", e.target.value)}
                                  placeholder="Observações específicas..."
                                  rows={2}
                                />
                              </div>

                              {service.serviceId && (
                                <div className="text-sm font-medium text-right">
                                  Total: {formatCurrency(calculateServiceTotal(service))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {garments.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Nenhuma peça adicionada</p>
                        <p className="text-sm">Clique em "Adicionar Peça" para começar</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount">Desconto Geral (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paymentStatus">Status de Pagamento</Label>
                      <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pago">Pago</SelectItem>
                          <SelectItem value="não pago">Não pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações Gerais</Label>
                    <Textarea
                      id="observations"
                      value={generalObservations}
                      onChange={(e) => setGeneralObservations(e.target.value)}
                      placeholder="Observações gerais sobre o pedido..."
                      rows={3}
                    />
                  </div>

                  {garments.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-lg font-bold text-right">
                        Total do Pedido: {formatCurrency(calculateTotal())}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                      Salvar Pedido
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
          ) : todaysOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum pedido hoje</p>
              <p className="text-sm">Os pedidos de hoje aparecerão aqui</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-smooth">
                      <TableCell className="font-medium">{order.clients?.name}</TableCell>
                      <TableCell>{order.clients?.phone}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.order_services?.reduce((groups: any, os) => {
                            const garmentName = os.garment_name || 'Sem nome';
                            if (!groups[garmentName]) {
                              groups[garmentName] = [];
                            }
                            groups[garmentName].push(os);
                            return groups;
                          }, {}) && Object.entries(
                            order.order_services?.reduce((groups: any, os) => {
                              const garmentName = os.garment_name || 'Sem nome';
                              if (!groups[garmentName]) {
                                groups[garmentName] = [];
                              }
                              groups[garmentName].push(os);
                              return groups;
                            }, {}) || {}
                          ).map(([garmentName, services]: [string, any]) => (
                            <div key={garmentName} className="text-sm">
                              <strong>{garmentName}:</strong>
                              <div className="ml-2">
                                {services.map((os: any) => (
                                  <div key={os.id}>• {os.services.name}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {order.general_observations || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.payment_status === 'pago' ? 'default' : 'secondary'}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        {order.confirmed ? (
                          <Badge variant="default" className="bg-green-600">
                            Confirmado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {!order.confirmed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmOrder(order.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-600"
                              title="Confirmar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(order.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Excluir"
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