import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Badge } from '../ui/badge';
import { WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Initial check - we assume connected if client init
    
    // Subscribe to system events
    const channel = supabase.channel('system');
    
    channel
      .on('system', { event: '*' }, () => {
        // System events might not be reliable for connection status in all versions
        // Better to rely on realtime status
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsConnected(false);
      });

    // Alternatively monitor the websocket directly if exposed, or assume connected
    // Supabase v2 doesn't expose a global "onDisconnect" easily without channel logic
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isConnected) return null; // Don't show if connected (clean UI)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant="destructive" 
        className="flex items-center gap-2 shadow-lg animate-pulse"
      >
        <WifiOff className="h-3 w-3" />
        <span>Disconnected</span>
      </Badge>
    </div>
  );
}
