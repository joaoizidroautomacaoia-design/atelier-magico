import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Scissors, DollarSign, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

const ServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um preço válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({ name: formData.name, price })
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Serviço editado com sucesso!",
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('services')
          .insert([{ name: formData.name, price, user_id: user?.id }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Serviço cadastrado com sucesso!",
        });
      }

      setFormData({ name: "", price: "" });
      setEditingService(null);
      setIsDialogOpen(false);
      fetchServices();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar serviço.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({ name: service.name, price: service.price.toString() });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso!",
      });
      fetchServices();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir serviço.",
        variant: "destructive",
      });
    }
  };

  const openNewDialog = () => {
    setEditingService(null);
    setFormData({ name: "", price: "" });
    setIsDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Scissors className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Gestão de Serviços
              </CardTitle>
              <CardDescription className="text-sm md:text-base mt-1">
                Cadastre e gerencie os serviços oferecidos pelo seu ateliê
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} className="bg-gradient-primary hover:opacity-90 transition-smooth w-full sm:w-auto h-10 md:h-11 text-sm md:text-base">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">
                    {editingService ? "Editar Serviço" : "Novo Serviço"}
                  </DialogTitle>
                  <DialogDescription className="text-sm md:text-base">
                    {editingService 
                      ? "Edite as informações do serviço aqui." 
                      : "Adicione um novo serviço ao sistema."
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm md:text-base">Nome do Serviço</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Bainha de calça, Ajuste de manga..."
                      className="h-10 md:h-11 text-sm md:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm md:text-base">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="h-10 md:h-11 text-sm md:text-base"
                      required
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-10 md:h-11 text-sm md:text-base">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto h-10 md:h-11 text-sm md:text-base">
                      {editingService ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 md:h-11 text-sm md:text-base"
            />
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm md:text-base">Carregando serviços...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base md:text-lg font-medium">Nenhum serviço cadastrado</p>
              <p className="text-xs md:text-sm">Comece adicionando seus primeiros serviços</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{service.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <DollarSign className="h-3 w-3 flex-shrink-0" />
                            <span className="font-medium">{formatPrice(service.price)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Serviço</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id} className="hover:bg-muted/50 transition-smooth">
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {formatPrice(service.price)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(service)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(service.id)}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManagement;