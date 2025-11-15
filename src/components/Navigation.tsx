import { useState } from "react";
import { Bell, Settings, User, Search, LogOut, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

interface NavigationProps {
  onProfileClick?: () => void;
}

export const Navigation = ({ onProfileClick }: NavigationProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  // Rimosso: const { acceptInvitation } = useDatabases();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  // Rimosso: handleAcceptInvitation
  /*
  const handleAcceptInvitation = async (notificationId: string, invitationId: string) => {
    const success = await acceptInvitation(invitationId);
    if (success) {
      await markAsRead(notificationId);
      setShowNotifications(false);
    }
  };
  */

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: it });
    } catch {
      return dateString;
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile effettuare il logout',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Logout effettuato',
        description: 'A presto!',
      });
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border shadow-soft">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">ATS</span>
            </div>
            <span className="text-xl font-bold text-foreground">TalentHub</span>
          </div>
        </div>

        {/* Search Rimosso */}
        {/* <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cerca candidati, posizioni, competenze..."
              className="pl-10 bg-secondary/50 border-0 focus-visible:bg-card transition-fast"
            />
          </div>
        </div> */}

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user?.email || 'Il mio account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={onProfileClick}
              >
                <User className="mr-2 h-4 w-4" />
                Profilo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notifiche ({unreadCount > 0 ? `${unreadCount} non lette` : 'tutte lette'})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nessuna notifica</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-fast ${
                    notification.read 
                      ? 'bg-card border-border' 
                      : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <Bell className={`h-5 w-5 mt-0.5 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs shrink-0">Nuova</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatTime(notification.created_at)}</p>
                    
                    {/* Rimosso: Logica di accettazione invito */}
                    {/* {notification.type === 'database_invitation' && notification.data?.invitation_id && !notification.read && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(notification.id, notification.data.invitation_id)}
                          className="flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Accetta
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Ignora
                        </Button>
                      </div>
                    )} */}
                    
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Segna come letta
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};