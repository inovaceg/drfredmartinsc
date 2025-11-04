import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Instagram, LogIn, LogOut, MessageSquare, Wifi, WifiOff, CloudOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner"; // Importar o toast do sonner diretamente
import { useUser } from "@/hooks/useUser"; // Usar o novo hook useUser
import { supabase } from "@/integrations/supabase/client"; // Importar supabase
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const Navbar = () => {
  const { user, isLoading: isUserLoading, profile } = useUser(); // Usar o novo hook
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Removido: const { toast } = useToast(); // Não é mais necessário, pois importamos o toast do sonner diretamente
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true); // Estado para conexão Supabase

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar a conexão com o Supabase
    const checkSupabaseConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        setIsSupabaseConnected(!error);
      } catch (e) {
        setIsSupabaseConnected(false);
      }
    };
    checkSupabaseConnection(); // Verifica ao montar

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleNavigationAndScroll = useCallback((sectionId: string) => {
    console.log("handleNavigationAndScroll called for:", sectionId);
    navigate(`/#${sectionId}`);
    setIsDrawerOpen(false);
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Você foi desconectado(a).");
      navigate("/auth");
    } catch (error: any) {
      console.error("Supabase Logout Error:", error.message);
      toast.error("Erro ao sair: " + error.message);
    }
  };

  return (
    <header className="sticky top-12 z-50 bg-card border-b border-border shadow-sm backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <div className="flex items-center space-x-3">
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer">
              Dr. Frederick Parreira
            </h1>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Button 
            onClick={() => { console.log("Desktop menu click: Sobre"); handleNavigationAndScroll("about"); }}
            variant="ghost"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Sobre
          </Button>
          <Button 
            onClick={() => { console.log("Desktop menu click: Serviços"); handleNavigationAndScroll("services"); }}
            variant="ghost"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Serviços
          </Button>
          <Button 
            onClick={() => { console.log("Desktop menu click: Depoimentos"); handleNavigationAndScroll("testimonials"); }}
            variant="ghost"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Depoimentos
          </Button>
          <Button 
            onClick={() => { console.log("Desktop menu click: Blog"); handleNavigationAndScroll("blog"); }}
            variant="ghost"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Blog
          </Button>
          <Button 
            onClick={() => { console.log("Desktop menu click: FAQ"); handleNavigationAndScroll("faq"); }}
            variant="ghost"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            FAQ
          </Button>
          <Button 
            onClick={() => { console.log("Desktop menu click: Contato"); handleNavigationAndScroll("contact"); }}
            variant="ghost"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Contato
          </Button>
          {user && profile?.is_doctor && (
            <Button 
              onClick={() => navigate("/doctor")}
              variant="ghost"
              className="font-medium"
            >
              Portal do Profissional
            </Button>
          )}
          {user && !profile?.is_doctor && (
            <Button 
              onClick={() => navigate("/patient")}
              variant="ghost"
              className="font-medium"
            >
              Portal do Paciente
            </Button>
          )}
          {user ? (
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Sair
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/auth")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogIn size={16} />
              Entrar
            </Button>
          )}
          {!isOnline ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          ) : !isSupabaseConnected ? (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <CloudOff className="h-3 w-3" /> Supabase Offline
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-400 border-green-500/30">
              <Wifi className="h-3 w-3" /> Online
            </Badge>
          )}
        </nav>

        <div className="hidden md:block">
          <Link to="/patient">
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
            >
              Agende Agora
            </Button>
          </Link>
        </div>

        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild className="md:hidden">
            <Button variant="ghost" className="p-2 text-foreground" aria-label="Abrir menu">
              <Menu size={24} />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[80vh] rounded-t-[10px] flex flex-col">
            <DrawerHeader className="text-left">
              <DrawerTitle>Navegação</DrawerTitle>
              <DrawerDescription>Explore o site ou acesse seu portal</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex flex-col space-y-2">
                <Link 
                  to="/#about"
                  onClick={() => setIsDrawerOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block w-full justify-start"
                >
                  Sobre
                </Link>
                <Link 
                  to="/#services"
                  onClick={() => setIsDrawerOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block w-full justify-start"
                >
                  Serviços
                </Link>
                <Link 
                  to="/#testimonials"
                  onClick={() => setIsDrawerOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block w-full justify-start"
                >
                  Depoimentos
                </Link>
                <Link 
                  to="/#blog"
                  onClick={() => setIsDrawerOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block w-full justify-start"
                >
                  Blog
                </Link>
                <Link 
                  to="/#faq"
                  onClick={() => setIsDrawerOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block w-full justify-start"
                >
                  FAQ
                </Link>
                <Link 
                  to="/#contact"
                  onClick={() => setIsDrawerOpen(false)}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block w-full justify-start"
                >
                  Contato
                </Link>
                {user && profile?.is_doctor && (
                  <Button 
                    onClick={() => {
                      navigate("/doctor");
                      setIsDrawerOpen(false);
                    }}
                    variant="ghost"
                    className="font-medium w-full justify-start text-lg"
                  >
                    Portal do Profissional
                  </Button>
                )}
                {user && !profile?.is_doctor && (
                  <Button 
                    onClick={() => {
                      navigate("/patient");
                      setIsDrawerOpen(false);
                    }}
                    variant="ghost"
                    className="font-medium w-full justify-start text-lg"
                  >
                    Portal do Paciente
                  </Button>
                )}
                {user ? (
                  <Button 
                    onClick={handleSignOut}
                    variant="outline"
                    className="flex items-center gap-2 w-full mt-2"
                  >
                    <LogOut size={16} />
                    Sair
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      navigate("/auth");
                      setIsDrawerOpen(false);
                    }}
                    variant="outline"
                    className="flex items-center gap-2 w-full mt-2"
                  >
                    <LogIn size={16} />
                    Entrar
                  </Button>
                )}
                <Link to="/patient">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-full mt-2 py-4 text-lg"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Agende Agora
                  </Button>
                </Link>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Fechar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
};

export default Navbar;