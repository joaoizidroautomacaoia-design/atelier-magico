import { useState } from "react";
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

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface OrderService {
  serviceId: string;
  serviceName: string;
  price: number;
  observation: string;
}

interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: OrderService[];
  discount: number;
  total: number;
  generalObservations: string;
  createdAt: Date;
}

const OrderManagement = () => {
  // Mock data - in a real app, this would come from a database
  const [clients] = useState<Client[]>([
    { id: "1", name: "Maria Silva", phone: "(11) 99999-9999" },
    { id: "2", name: "João Santos", phone: "(11) 88888-8888" },
  ]);
  
  const [services] = useState<Service[]>([
    { id: "1", name: "Bainha de calça", price: 25.00 },
    { id: "2", name: "Ajuste de manga", price: 30.00 },
    { id: "3", name: "Costura de zíper", price: 20.00 },
  ]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    services: [] as OrderService[],
    discount: 0,
    generalObservations: "",
  });
  const { toast } = useToast();

  const calculateTotal = (orderServices: OrderService[], discount: number) => {
    const subtotal = orderServices.reduce((sum, service) => sum + service.price, 0);
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || formData.services.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um cliente e adicione pelo menos um serviço.",
        variant: "destructive",
      });
      return;
    }

    const selectedClient = clients.find(c => c.id === formData.clientId);
    if (!selectedClient) return;

    const total = calculateTotal(formData.services, formData.discount);

    if (editingOrder) {
      setOrders(orders.map(order => 
        order.id === editingOrder.id 
          ? {
              ...order,
              ...formData,
              clientName: selectedClient.name,
              clientPhone: selectedClient.phone,
              total,
            }
          : order
      ));
      toast({
        title: "Sucesso",
        description: "Pedido editado com sucesso!",
      });
    } else {
      const newOrder: Order = {
        id: Date.now().toString(),
        ...formData,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phone,
        total,
        createdAt: new Date(),
      };
      setOrders([...orders, newOrder]);
      toast({
        title: "Sucesso",
        description: "Pedido cadastrado com sucesso!",
      });
    }

    resetForm();
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
      clientId: order.clientId,
      services: order.services,
      discount: order.discount,
      generalObservations: order.generalObservations,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setOrders(orders.filter(order => order.id !== id));
    toast({
      title: "Sucesso",
      description: "Pedido excluído com sucesso!",
    });
  };

  const addService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const newOrderService: OrderService = {
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      observation: "",
    };

    setFormData({
      ...formData,
      services: [...formData.services, newOrderService],
    });
  };

  const removeService = (index: number) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index),
    });
  };

  const updateServiceObservation = (index: number, observation: string) => {
    const updatedServices = [...formData.services];
    updatedServices[index].observation = observation;
    setFormData({
      ...formData,
      services: updatedServices,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
                Crie e gerencie os pedidos dos seus clientes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} className="bg-gradient-primary hover:opacity-90 transition-smooth">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pedido
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOrder ? "Editar Pedido" : "Novo Pedido"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrder 
                      ? "Edite as informações do pedido aqui." 
                      : "Crie um novo pedido para um cliente."
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente</Label>
                    <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedClient && (
                      <p className="text-sm text-muted-foreground">
                        Telefone: {selectedClient.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Serviços</Label>
                    <Select onValueChange={addService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Adicionar serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services
                          .filter(service => !formData.services.some(s => s.serviceId === service.id))
                          .map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - {formatPrice(service.price)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {formData.services.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <Label>Serviços Adicionados</Label>
                        {formData.services.map((service, index) => (
                          <Card key={index} className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{service.serviceName}</p>
                                <p className="text-sm text-muted-foreground">{formatPrice(service.price)}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeService(index)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Observações para este serviço..."
                              value={service.observation}
                              onChange={(e) => updateServiceObservation(index, e.target.value)}
                              className="mt-2"
                            />
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

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

                  {formData.services.length > 0 && (
                    <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {formData.discount > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                          <span>Desconto ({formData.discount}%):</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-lg">
                        <span>Total:</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="generalObservations">Observações Gerais</Label>
                    <Textarea
                      id="generalObservations"
                      value={formData.generalObservations}
                      onChange={(e) => setFormData({ ...formData, generalObservations: e.target.value })}
                      placeholder="Ex: tecido fornecido pelo cliente, ajustes futuros..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90">
                      {editingOrder ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
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
                    <TableHead>Serviços</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-smooth">
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.clientName}</p>
                          <p className="text-sm text-muted-foreground">{order.clientPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {order.services.map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service.serviceName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(order.createdAt)}
                      </TableCell>
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