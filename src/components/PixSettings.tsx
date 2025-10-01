import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PixSetting {
  id: string;
  pix_key: string;
  pix_key_type: 'email' | 'phone' | 'cpf' | 'cnpj';
}

const PixSettings = () => {
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<'email' | 'phone' | 'cpf' | 'cnpj'>('phone');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPixSettings();
  }, []);

  const fetchPixSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pix_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPixKey(data.pix_key);
        setPixKeyType(data.pix_key_type as 'email' | 'phone' | 'cpf' | 'cnpj');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações Pix:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pixKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma chave Pix.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: existingSetting } = await supabase
        .from('pix_settings')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingSetting) {
        const { error } = await supabase
          .from('pix_settings')
          .update({ pix_key: pixKey, pix_key_type: pixKeyType })
          .eq('id', existingSetting.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pix_settings')
          .insert([{ pix_key: pixKey, pix_key_type: pixKeyType, user_id: user?.id }]);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configurações Pix salvas com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações Pix.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPlaceholder = () => {
    switch (pixKeyType) {
      case 'email':
        return 'seu@email.com';
      case 'phone':
        return '(11) 99999-9999';
      case 'cpf':
        return '000.000.000-00';
      case 'cnpj':
        return '00.000.000/0000-00';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <QrCode className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          Configuração de Chave Pix
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Configure sua chave Pix para receber pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pixKeyType" className="text-sm md:text-base">Tipo de Chave</Label>
            <Select value={pixKeyType} onValueChange={(value) => setPixKeyType(value as any)}>
              <SelectTrigger id="pixKeyType" className="h-10 md:h-11 text-sm md:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pixKey" className="text-sm md:text-base">Chave Pix</Label>
            <Input
              id="pixKey"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder={getPlaceholder()}
              className="h-10 md:h-11 text-sm md:text-base"
              required
            />
          </div>

          <div className="bg-muted/50 p-3 md:p-4 rounded-lg">
            <p className="text-xs md:text-sm text-muted-foreground">
              <strong>Nota:</strong> Esta chave será usada para gerar o QR Code Pix nos pedidos impressos.
              Certifique-se de inserir uma chave válida e ativa.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth h-10 md:h-11 text-sm md:text-base"
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PixSettings;