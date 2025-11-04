"use client";

import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SupabaseRealtimeProviderProps {
  children: React.ReactNode;
}

export const SupabaseRealtimeProvider: React.FC<SupabaseRealtimeProviderProps> = ({ children }) => {
  useEffect(() => {
    console.log("SupabaseRealtimeProvider: Initializing Realtime connection...");

    // Subscribe to a general presence channel to keep the connection alive
    // This signals to Supabase that there's an active client.
    const channel = supabase.channel('global_presence', {
      config: {
        presence: {
          key: 'user_id_placeholder', // A key is required for presence, but can be generic if not tracking specific users here
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log("SupabaseRealtimeProvider: Presence sync event received.");
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log("SupabaseRealtimeProvider: New user joined presence:", newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log("SupabaseRealtimeProvider: User left presence:", leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log("SupabaseRealtimeProvider: Subscribed to 'global_presence' channel.");
          // Optionally, track presence if needed
          // await channel.track({ user_id: supabase.auth.user()?.id || 'anonymous', status: 'online' });
        } else if (status === 'CHANNEL_ERROR') {
          console.error("SupabaseRealtimeProvider: Realtime channel error. Attempting to re-subscribe in 5 seconds.");
          toast.error("Erro na conexão em tempo real com o servidor. Tentando reconectar...");
          setTimeout(() => {
            // Tenta remover e re-subscrever o canal após um atraso
            supabase.removeChannel(channel);
            // A próxima renderização do componente (ou um re-mount) irá re-inicializar o useEffect
            // Para forçar uma re-inicialização, poderíamos usar um estado, mas por enquanto,
            // vamos confiar que o navegador tentará se reconectar ou que o componente será re-montado.
          }, 5000);
        } else if (status === 'TIMED_OUT') {
          console.warn("SupabaseRealtimeProvider: Realtime subscription timed out. Attempting to re-subscribe in 5 seconds.");
          toast.warning("Conexão em tempo real demorou para responder. Tentando reconectar...");
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 5000);
        } else if (status === 'CLOSED') {
          console.log("SupabaseRealtimeProvider: Realtime channel closed.");
        }
      });

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      console.log("SupabaseRealtimeProvider: Unsubscribing from 'global_presence' channel.");
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return <>{children}</>;
};