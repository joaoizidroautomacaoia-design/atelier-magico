import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, User, Phone, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({ name: formData.name, phone: formData.phone })
          .eq('id', editingClient.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cliente editado com sucesso!",
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from('clients')
          .insert([{ name: formData.name, phone: formData.phone, user_id: user?.id }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Cliente cadastrado com sucesso!",
        });
      }

      setFormData({ name: "", phone: "" });
      setEditingClient(null);
      setIsDialogOpen(false);
      fetchClients();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, phone: client.phone });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso!",
      });
      fetchClients();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente.",
        variant: "destructive",
      });
    }
  };

  const openNewDialog = () => {
    setEditingClient(null);
    setFormData({ name: "", phone: "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Gestão de Clientes
              </CardTitle>
              <CardDescription className="text-sm md:text-base mt-1">
                Cadastre e gerencie as informações dos seus clientes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog} className="bg-gradient-primary hover:opacity-90 transition-smooth w-full sm:w-auto h-10 md:h-11 text-sm md:text-base">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-xl">
                    {editingClient ? "Editar Cliente" : "Novo Cliente"}
                  </DialogTitle>
                  <DialogDescription className="text-sm md:text-base">
                    {editingClient 
                      ? "Edite as informações do cliente aqui." 
                      : "Adicione um novo cliente ao sistema."
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm md:text-base">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome completo do cliente"
                      className="h-10 md:h-11 text-sm md:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm md:text-base">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="h-10 md:h-11 text-sm md:text-base"
                      required
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto h-10 md:h-11 text-sm md:text-base">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto h-10 md:h-11 text-sm md:text-base">
                      {editingClient ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Campo de pesquisa */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 md:h-11"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm md:text-base">Carregando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base md:text-lg font-medium">{clients.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}</p>
              <p className="text-xs md:text-sm">{clients.length === 0 ? "Comece adicionando seu primeiro cliente" : "Tente buscar com outros termos"}</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{client.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{client.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/50 transition-smooth">
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {client.phone}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(client)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
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

export default ClientManagement;