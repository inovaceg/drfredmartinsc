import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X, Instagram, LogIn, LogOut, MessageSquare, Wifi, WifiOff, CloudOff } from "lucide-react"; // Added Wifi, WifiOff, CloudOff
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js"; // Import User type
import { Badge } from "@/components/ui/badge"; // Import Badge

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null); // Explicitly type user state
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Track browser online status
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true); // Track Supabase connection
  const [lastSupabaseStatus, setLastSupabaseStatus] = useState(true); // To track changes for toast notifications

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      console.log("Navbar: Tentando buscar a função (role) para o userId:", userId);
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Navbar: Erro ao buscar a função do usuário:", error);
        toast({
          title: "Erro ao carregar função do usuário",
          description: error.message,
          variant: "destructive",
        });
        setUserRole(null);
      } else if (data) {
        console.log("Navbar: Função do usuário encontrada:", data.role);
        setUserRole(data.role);
      } else {
        console.log("Navbar: Nenhuma função encontrada para o usuário:", userId);
        setUserRole(null);
      }
    };

    const handleAuthStateChange = async (event: string, session: any) => { // Use 'any' for session to match Supabase type
      console.log("Navbar: Auth state change event:", event, "Sessão:", session); // ADDED LOG
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        console.log("Navbar: Usuário logado:", currentUser.id, currentUser.email);
        await fetchUserRole(currentUser.id);
      } else {
        console.log("Navbar: Usuário deslogado.");
        setUserRole(null);
        // Redireciona para a página de autenticação se o usuário for deslogado
        if (event === 'SIGNED_OUT') {
          navigate("/auth");
        }
      }
    };

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Navbar: Verificação inicial da sessão. Sessão:", session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        console.log("Navbar: Usuário logado inicialmente:", currentUser.id, currentUser.email);
        await fetchUserRole(currentUser.id);
      } else {
        console.log("Navbar: Nenhum usuário logado inicialmente.");
        setUserRole(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, [toast, navigate]); // Added navigate to dependency array

  // New: Effect to monitor network status and Supabase connection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkSupabaseConnection = async () => {
      let isDbConnected = false;
      let isAuthServiceReachable = false; // Renamed for clarity
      let dbErrorMessage = '';
      let authErrorMessage = '';

      const connectionTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tempo limite de conexão excedido.")), 15000) // 15 seconds timeout
      );

      try {
        // Attempt a lightweight query to check database connectivity
        const { error: dbError } = await Promise.race([
          supabase.from('profiles').select('id').limit(1),
          connectionTimeout,
        ]) as { data: any | null; error: any }; // Cast to handle Promise.race return type

        isDbConnected = !dbError;
        if (dbError) {
          dbErrorMessage = dbError.message;
          console.error("Navbar: DB connection check failed:", dbError.message);
        } else {
          console.log("Navbar: DB connection check successful.");
        }

        // Attempt to get session to check auth service connectivity
        const { error: authError } = await Promise.race([
          supabase.auth.getSession(),
          connectionTimeout,
        ]) as { data: { session: any | null }; error: any }; // Cast to handle Promise.race return type

        isAuthServiceReachable = !authError; // Auth service is reachable if no error occurred
        if (authError) {
          authErrorMessage = authError.message;
          console.error("Navbar: Auth connection check failed:", authError.message);
        } else {
          console.log("Navbar: Auth service reachable.");
        }

        const currentStatus = isDbConnected && isAuthServiceReachable; // Both must be connected
        setIsSupabaseConnected(currentStatus);

        if (currentStatus !== lastSupabaseStatus) {
          if (currentStatus) {
            toast({
              title: "Conexão Supabase Restabelecida",
              description: "A conexão com o servidor foi restaurada.",
              variant: "default",
            });
          } else {
            toast({
              title: "Conexão Supabase Perdida",
              description: `Não foi possível conectar ao servidor. Detalhes: ${dbErrorMessage || authErrorMessage || 'Erro desconhecido'}. Algumas funcionalidades podem estar limitadas.`,
              variant: "destructive",
            });
          }
          setLastSupabaseStatus(currentStatus);
        }
        console.log(`Supabase Status Check: DB Connected: ${isDbConnected} (${dbErrorMessage}), Auth Service Reachable: ${isAuthServiceReachable} (${authErrorMessage}), Overall: ${currentStatus}`);
      } catch (e: any) { // Captura qualquer erro inesperado aqui, incluindo timeouts
        console.error("Navbar: Unexpected error during Supabase connection check:", e);
        const currentStatus = false;
        setIsSupabaseConnected(currentStatus);
        if (currentStatus !== lastSupabaseStatus) {
          toast({
            title: "Conexão Supabase Perdida",
            description: `Não foi possível conectar ao servidor. Detalhes: ${e.message || 'Erro desconhecido'}. Algumas funcionalidades podem estar limitadas.`,
            variant: "destructive",
          });
          setLastSupabaseStatus(currentStatus);
        }
      }
    };

    // Check immediately and then every 10 seconds
    checkSupabaseConnection();
    const interval = setInterval(checkSupabaseConnection, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [toast, lastSupabaseStatus]); // Added lastSupabaseStatus to dependency array

  const scrollToSection = (sectionId: string) => {
    try {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        setIsDrawerOpen(false);
      }
    } catch (error) {
      console.error(`Error scrolling to ${sectionId}:`, error);
      const element = document.getElementById(sectionId);
      if (element) {
        const yOffset = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({top: yOffset, behavior: 'smooth'});
        setIsDrawerOpen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <div className="flex items-center space-x-3">
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer">
              Dr. Frederick Parreira
            </h1>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a 
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              const element = document.querySelector('#about');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Sobre
          </a>
          <a 
            href="#credentials"
            onClick={(e) => {
              e.preventDefault();
              const element = document.querySelector('#credentials');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Formação
          </a>
          <a 
            href="https://instagram.com/drfredmartinsjf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
          >
            <Instagram size={20} />
            Instagram
          </a>
          {user && userRole === 'doctor' && (
            <Button 
              onClick={() => navigate("/doctor")}
              variant="ghost"
              className="font-medium"
            >
              Portal do Profissional
            </Button>
          )}
          {user && userRole === 'patient' && (
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
              onClick={async () => {
                console.log("Navbar: Tentando deslogar...");
                const { error } = await supabase.auth.signOut();
                if (error) {
                  console.error("Navbar: Erro ao deslogar:", error);
                  toast({
                    title: "Erro ao sair",
                    description: error.message,
                    variant: "destructive",
                  });
                } else {
                  console.log("Navbar: Deslogado com sucesso. Redirecionando para /auth.");
                  toast({
                    title: "Sucesso",
                    description: "Você foi desconectado(a).",
                  });
                  navigate("/auth"); // Redireciona para a página de autenticação após o logout
                }
              }}
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
          {/* New: Network Status Indicator */}
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
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
            onClick={() => scrollToSection('about')} // Changed to 'about' since 'contact' is removed
          >
            Agende Agora
          </Button>
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
                <a 
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('about');
                  }}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block"
                >
                  Sobre
                </a>
                <a 
                  href="#credentials"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection('credentials');
                  }}
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg block"
                >
                  Formação
                </a>
                <a 
                  href="https://instagram.com/drfredmartinsjf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/80 hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg px-4 py-3 transition-colors text-lg flex items-center gap-2"
                >
                  <Instagram size={20} />
                  Instagram
                </a>
                {user && userRole === 'doctor' && (
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
                {user && userRole === 'patient' && (
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
                    onClick={async () => {
                      console.log("Navbar (Drawer): Tentando deslogar...");
                      const { error } = await supabase.auth.signOut();
                      if (error) {
                        console.error("Navbar (Drawer): Erro ao deslogar:", error);
                        toast({
                          title: "Erro ao sair",
                          description: error.message,
                          variant: "destructive",
                        });
                      } else {
                        console.log("Navbar (Drawer): Deslogado com sucesso. Redirecionando para /auth.");
                        toast({
                          title: "Sucesso",
                          description: "Você foi desconectado(a).",
                        });
                        navigate("/auth"); // Redireciona para a página de autenticação após o logout
                        setIsDrawerOpen(false);
                      }
                    }}
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
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-full mt-2 py-4 text-lg"
                  onClick={() => {
                    scrollToSection('about'); // Changed to 'about' since 'contact' is removed
                  }}
                >
                  Agende Agora
                </Button>
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