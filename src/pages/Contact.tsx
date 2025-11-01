import React, { useState } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Instagram, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatPhone, unformatPhone } from "@/lib/format-phone";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    date_of_birth: "",
    zip_code: "",
    state: "",
    city: "",
    street: "",
    neighborhood: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    if (id === "whatsapp") {
      setFormData((prev) => ({ ...prev, [id]: formatPhone(value) }));
    } else if (id === "date_of_birth") {
      let formattedValue = value.replace(/\D/g, ''); // Remove non-digits
      if (formattedValue.length > 0) {
        formattedValue = formattedValue.substring(0, 2) + (formattedValue.length > 2 ? '/' + formattedValue.substring(2, 4) : '') + (formattedValue.length > 4 ? '/' + formattedValue.substring(4, 8) : '');
      }
      setFormData((prev) => ({ ...prev, [id]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleZipCodeLookup = async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, zip_code: cleanedCep }));

    if (cleanedCep.length === 8) {
      setIsFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();

        if (data.erro) {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado e tente novamente.",
            variant: "destructive",
          });
          setFormData((prev) => ({ ...prev, state: "", city: "", street: "", neighborhood: "" }));
        } else {
          setFormData((prev) => ({
            ...prev,
            state: data.uf,
            city: data.localidade,
            street: data.logradouro,
            neighborhood: data.bairro,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        toast({
          title: "Erro na consulta de CEP",
          description: "Não foi possível buscar o CEP. Tente novamente mais tarde.",
          variant: "destructive",
        });
        setFormData((prev) => ({ ...prev, state: "", city: "", street: "", neighborhood: "" }));
      } finally {
        setIsFetchingCep(false);
      }
    } else if (cleanedCep.length < 8) {
      setFormData((prev) => ({ ...prev, state: "", city: "", street: "", neighborhood: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!formData.name || !formData.content) {
      toast({
        title: "Erro",
        description: "Nome e mensagem são campos obrigatórios.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Date format validation (DD/MM/YYYY)
    let formattedBirthDate: string | null = null;
    if (formData.date_of_birth) {
      const parts = formData.date_of_birth.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900) {
          formattedBirthDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
      if (!formattedBirthDate) {
        toast({
          title: "Erro de Data",
          description: "O formato da data de nascimento deve ser DD/MM/AAAA e ser uma data válida.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name,
          whatsapp: formData.whatsapp ? unformatPhone(formData.whatsapp) : null,
          date_of_birth: formattedBirthDate,
          zip_code: formData.zip_code || null,
          state: formData.state || null,
          city: formData.city || null,
          street: formData.street || null,
          neighborhood: formData.neighborhood || null,
          content: formData.content,
          is_read: false,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Sua mensagem foi enviada com sucesso. Em breve entraremos em contato!",
      });
      setFormData({
        name: "",
        whatsapp: "",
        date_of_birth: "",
        zip_code: "",
        state: "",
        city: "",
        street: "",
        neighborhood: "",
        content: "",
      });
    } catch (error: any) {
      console.error("Erro ao enviar mensagem de contato:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-20 lg:py-24 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full font-medium mb-4">
              Contato
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Fale Comigo
              <span className="block bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Estou Aqui Para Ajudar
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Envie sua mensagem, dúvida ou agende seu primeiro contato.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Formulário de Contato */}
            <div className="bg-white/10 border border-white/10 p-8 rounded-2xl backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white mb-6">Envie Sua Mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-white">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="99-9-9999-9999"
                    maxLength={15}
                    className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-white">Data de Nascimento (DD/MM/AAAA)</Label>
                  <Input
                    id="date_of_birth"
                    type="text"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="text-white">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleZipCodeLookup(e.target.value)}
                    onBlur={(e) => handleZipCodeLookup(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={isFetchingCep}
                    className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                  />
                  {isFetchingCep && <p className="text-xs text-muted-foreground mt-1">Buscando CEP...</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Estado"
                      readOnly
                      disabled={isFetchingCep}
                      className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Cidade"
                      readOnly
                      disabled={isFetchingCep}
                      className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street" className="text-white">Rua/Avenida</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Nome da rua ou avenida"
                    readOnly
                    disabled={isFetchingCep}
                    className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood" className="text-white">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="Nome do bairro"
                    readOnly
                    disabled={isFetchingCep}
                    className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-white">Sua Mensagem *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Escreva sua mensagem aqui..."
                    rows={5}
                    className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading || isFetchingCep}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Mensagem"
                  )}
                </Button>
              </form>
            </div>

            {/* Informações de Contato */}
            <div className="bg-white/10 border border-white/10 p-8 rounded-2xl backdrop-blur-md space-y-8">
              <h2 className="text-2xl font-bold text-white mb-6">Informações de Contato</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Phone className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70">Telefone / WhatsApp</p>
                    <a href="https://wa.me/553291931779" target="_blank" rel="noopener noreferrer" className="text-white text-lg font-semibold hover:underline">
                      +55 32 9193-1779
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70">Email</p>
                    <a href="mailto:contato@drfredmartins.com.br" className="text-white text-lg font-semibold hover:underline">
                      contato@drfredmartins.com.br
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Instagram className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70">Instagram</p>
                    <a href="https://instagram.com/drfredmartinsjf" target="_blank" rel="noopener noreferrer" className="text-white text-lg font-semibold hover:underline">
                      @drfredmartinsjf
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-white/70">Endereço</p>
                    <p className="text-white text-lg font-semibold">Juiz de Fora, MG</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;