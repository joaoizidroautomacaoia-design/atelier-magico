import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Trash2, FileText, X, Check, Eye, ChevronDown, Printer } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<'pagos' | 'nao-pagos'>('nao-pagos');
  const [observationsDialog, setObservationsDialog] = useState<Order | null>(null);
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [serviceSearchOpen, setServiceSearchOpen] = useState<number[]>([]);
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
    
    if (name.length > 1) {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(name.toLowerCase())
      );
      setClientSuggestions(filtered);
      setShowClientSuggestions(filtered.length > 0);
      
      const foundClient = clients.find(client => 
        client.name.toLowerCase() === name.toLowerCase()
      );
      
      if (foundClient) {
        setExistingClient(foundClient);
        setClientPhone(foundClient.phone);
      } else {
        setExistingClient(null);
      }
    } else {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      setExistingClient(null);
    }
  };

  const selectClient = (client: Client) => {
    setClientName(client.name);
    setClientPhone(client.phone);
    setExistingClient(client);
    setShowClientSuggestions(false);
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

  const calculateSubtotal = () => {
    return garments.reduce((total, garment) => {
      return total + garment.services.reduce((garmentTotal, service) => {
        return garmentTotal + service.price;
      }, 0);
    }, 0);
  };

  const calculateTotalWithServiceDiscounts = () => {
    return garments.reduce((total, garment) => {
      return total + garment.services.reduce((garmentTotal, service) => {
        return garmentTotal + calculateServiceTotal(service);
      }, 0);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotalWithServiceDiscounts = calculateTotalWithServiceDiscounts();
    const generalDiscountAmount = (subtotalWithServiceDiscounts * discount) / 100;
    return subtotalWithServiceDiscounts - generalDiscountAmount;
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

  const confirmPayment = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pago' ? 'não pago' : 'pago';
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status alterado para ${newStatus}!`,
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status de pagamento.",
        variant: "destructive",
      });
    }
  };

  const editOrder = (order: Order) => {
    setEditingOrder(order);
    setClientName(order.clients?.name || "");
    setClientPhone(order.clients?.phone || "");
    setExistingClient(order.clients || null);
    setDiscount(order.discount);
    setGeneralObservations(order.general_observations || "");
    setPaymentStatus(order.payment_status);
    
    // Reconstruct garments from order_services
    const garmentGroups = order.order_services?.reduce((groups: any, os) => {
      const garmentName = os.garment_name || 'Sem nome';
      if (!groups[garmentName]) {
        groups[garmentName] = [];
      }
      groups[garmentName].push({
        serviceId: os.service_id,
        serviceName: os.services.name,
        price: os.services.price,
        individualDiscount: os.individual_discount,
        observation: os.observations || ""
      });
      return groups;
    }, {}) || {};

    const reconstructedGarments = Object.entries(garmentGroups).map(([name, services]: [string, any]) => ({
      name,
      services
    }));

    setGarments(reconstructedGarments);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderServices = order.order_services || [];
    const garmentGroups = orderServices.reduce((groups: any, os) => {
      const garmentName = os.garment_name || 'Sem nome';
      if (!groups[garmentName]) {
        groups[garmentName] = [];
      }
      groups[garmentName].push(os);
      return groups;
    }, {});

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido - ${order.clients?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .order-info { margin-bottom: 30px; }
            .garment { margin-bottom: 20px; border: 1px solid #ccc; padding: 15px; }
            .garment-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
            .service { margin-left: 20px; margin-bottom: 10px; }
            .total-section { margin-top: 30px; border-top: 2px solid #000; padding-top: 20px; text-align: right; }
            .total-line { margin-bottom: 5px; }
            .final-total { font-weight: bold; font-size: 18px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedido de Serviço</h1>
            <p>Data: ${formatDate(order.created_at)}</p>
          </div>
          
          <div class="order-info">
            <p><strong>Cliente:</strong> ${order.clients?.name}</p>
            <p><strong>Telefone:</strong> ${order.clients?.phone}</p>
            <p><strong>Status:</strong> ${order.payment_status === 'pago' ? 'Pago' : 'Não Pago'}</p>
          </div>
          
          <div class="services">
            <h3>Serviços:</h3>
            ${Object.entries(garmentGroups).map(([garmentName, services]: [string, any]) => `
              <div class="garment">
                <div class="garment-title">${garmentName}</div>
                ${services.map((service: any) => `
                  <div class="service">
                    • ${service.services.name} - ${formatCurrency(service.services.price)}
                    ${service.individual_discount > 0 ? ` (Desconto: ${service.individual_discount}% = ${formatCurrency(service.services.price - (service.services.price * service.individual_discount / 100))})` : ''}
                    ${service.observations ? `<br>&nbsp;&nbsp;<em>Obs: ${service.observations}</em>` : ''}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
          
          ${order.general_observations ? `
            <div style="margin-top: 20px;">
              <p><strong>Observações Gerais:</strong></p>
              <p>${order.general_observations}</p>
            </div>
          ` : ''}
          
          <div class="total-section">
            <div class="total-line">Subtotal: ${formatCurrency(order.total + (order.total * order.discount / (100 - order.discount)))}</div>
            ${order.discount > 0 ? `<div class="total-line">Desconto Geral: ${order.discount}%</div>` : ''}
            <div class="final-total">Total: ${formatCurrency(order.total)}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getTodaysOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(order => 
      new Date(order.created_at).toDateString() === today
    );
  };

  const getFilteredOrders = () => {
    const todaysOrders = getTodaysOrders();
    return todaysOrders.filter(order => 
      activeTab === 'pagos' ? order.payment_status === 'pago' : order.payment_status === 'não pago'
    );
  };

  const filteredOrders = getFilteredOrders();
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
                  <DialogTitle>{editingOrder ? 'Editar Pedido' : 'Novo Pedido'}</DialogTitle>
                  <DialogDescription>
                    {editingOrder ? 'Edite os dados do pedido.' : 'Crie um novo pedido selecionando cliente e serviços.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2 relative">
                       <Label htmlFor="clientName">Nome do Cliente</Label>
                       <Input
                         id="clientName"
                         value={clientName}
                         onChange={(e) => handleClientNameChange(e.target.value)}
                         placeholder="Digite o nome do cliente..."
                         required
                         onFocus={() => clientSuggestions.length > 0 && setShowClientSuggestions(true)}
                         onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                       />
                       {showClientSuggestions && clientSuggestions.length > 0 && (
                         <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                           {clientSuggestions.map((client) => (
                             <div
                               key={client.id}
                               className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                               onClick={() => selectClient(client)}
                             >
                               <div className="font-medium text-foreground">{client.name}</div>
                               <div className="text-sm text-muted-foreground">{client.phone}</div>
                             </div>
                           ))}
                         </div>
                       )}
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
                                   <Popover 
                                     open={serviceSearchOpen.includes(garmentIndex * 1000 + serviceIndex)} 
                                     onOpenChange={(open) => {
                                       const key = garmentIndex * 1000 + serviceIndex;
                                       if (open) {
                                         setServiceSearchOpen([...serviceSearchOpen, key]);
                                       } else {
                                         setServiceSearchOpen(serviceSearchOpen.filter(k => k !== key));
                                       }
                                     }}
                                   >
                                     <PopoverTrigger asChild>
                                       <Button
                                         variant="outline"
                                         role="combobox"
                                         className="justify-between w-full"
                                       >
                                         {service.serviceId ? service.serviceName : "Selecione um serviço..."}
                                         <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                       </Button>
                                     </PopoverTrigger>
                                     <PopoverContent className="w-80 p-0">
                                       <Command>
                                         <CommandInput placeholder="Buscar serviço..." />
                                         <CommandList>
                                           <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
                                           <CommandGroup>
                                             {services.map((s) => (
                                               <CommandItem
                                                 key={s.id}
                                                 value={s.name}
                                                 onSelect={() => {
                                                   updateGarmentService(garmentIndex, serviceIndex, "serviceId", s.id);
                                                   const key = garmentIndex * 1000 + serviceIndex;
                                                   setServiceSearchOpen(serviceSearchOpen.filter(k => k !== key));
                                                 }}
                                               >
                                                 <div className="flex justify-between w-full">
                                                   <span>{s.name}</span>
                                                   <span className="text-muted-foreground">{formatCurrency(s.price)}</span>
                                                 </div>
                                               </CommandItem>
                                             ))}
                                           </CommandGroup>
                                         </CommandList>
                                       </Command>
                                     </PopoverContent>
                                   </Popover>
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
                     <div className="p-4 bg-muted rounded-lg space-y-2">
                       <div className="text-right space-y-1">
                         <div className="flex justify-between items-center">
                           <span className="text-sm text-muted-foreground">Subtotal Original:</span>
                           <span className="line-through text-muted-foreground">{formatCurrency(calculateSubtotal())}</span>
                         </div>
                         
                         {calculateSubtotal() !== calculateTotalWithServiceDiscounts() && (
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-muted-foreground">Após Descontos dos Serviços:</span>
                             <span>{formatCurrency(calculateTotalWithServiceDiscounts())}</span>
                           </div>
                         )}
                         
                         {discount > 0 && (
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-muted-foreground">Desconto Geral ({discount}%):</span>
                             <span className="text-red-600">-{formatCurrency((calculateTotalWithServiceDiscounts() * discount) / 100)}</span>
                           </div>
                         )}
                         
                         <hr className="my-2" />
                         <div className="flex justify-between items-center">
                           <span className="text-lg font-bold">Total Final:</span>
                           <span className="text-lg font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                         </div>
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pagos' | 'nao-pagos')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nao-pagos">Não Pagos ({todaysOrders.filter(o => o.payment_status === 'não pago').length})</TabsTrigger>
                <TabsTrigger value="pagos">Pagos ({todaysOrders.filter(o => o.payment_status === 'pago').length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum pedido {activeTab === 'pagos' ? 'pago' : 'não pago'} hoje</p>
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
                          <TableHead>Total</TableHead>
                          <TableHead className="w-[150px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
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
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setObservationsDialog(order)}
                                className="h-8 px-2 text-blue-600 hover:text-blue-600"
                                title="Ver Observações"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </TableCell>
                            <TableCell className="font-bold">
                              {formatCurrency(order.total)}
                            </TableCell>
                             <TableCell>
                               <div className="flex items-center space-x-1">
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => confirmPayment(order.id, order.payment_status)}
                                   className="h-8 w-8 p-0 text-green-600 hover:text-green-600"
                                   title="Confirmar Pagamento"
                                 >
                                   <Check className="h-4 w-4" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => editOrder(order)}
                                   className="h-8 w-8 p-0 text-blue-600 hover:text-blue-600"
                                   title="Editar"
                                 >
                                   <Edit className="h-4 w-4" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => printOrder(order)}
                                   className="h-8 w-8 p-0 text-purple-600 hover:text-purple-600"
                                   title="Imprimir Nota"
                                 >
                                   <Printer className="h-4 w-4" />
                                 </Button>
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
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Observações */}
      <Dialog open={!!observationsDialog} onOpenChange={() => setObservationsDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Observações do Pedido</DialogTitle>
            <DialogDescription>
              Cliente: {observationsDialog?.clients?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {observationsDialog?.general_observations && (
              <div>
                <h4 className="font-medium text-sm mb-2">Observações Gerais:</h4>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {observationsDialog.general_observations}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-sm mb-2">Observações por Serviço:</h4>
              <div className="space-y-3">
                {observationsDialog?.order_services?.reduce((groups: any, os) => {
                  const garmentName = os.garment_name || 'Sem nome';
                  if (!groups[garmentName]) {
                    groups[garmentName] = [];
                  }
                  groups[garmentName].push(os);
                  return groups;
                }, {}) && Object.entries(
                  observationsDialog?.order_services?.reduce((groups: any, os) => {
                    const garmentName = os.garment_name || 'Sem nome';
                    if (!groups[garmentName]) {
                      groups[garmentName] = [];
                    }
                    groups[garmentName].push(os);
                    return groups;
                  }, {}) || {}
                ).map(([garmentName, services]: [string, any]) => (
                  <div key={garmentName} className="border rounded-lg p-3">
                    <h5 className="font-medium text-sm mb-2">{garmentName}:</h5>
                    <div className="space-y-2">
                      {services.map((os: any) => (
                        <div key={os.id} className="text-sm">
                          <strong>• {os.services.name}:</strong>
                          <p className="ml-4 text-muted-foreground">
                            {os.observations || "Sem observações"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;