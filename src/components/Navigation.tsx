import { useState } from "react";
import { Bell, Settings, User, Search, LogOut } from "lucide-react";
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

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);

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

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cerca candidati, posizioni, competenze..."
              className="pl-10 bg-secondary/50 border-0 focus-visible:bg-card transition-fast"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="h-4 w-4" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              3
            </Badge>
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
                onClick={() => toast({ title: 'Profilo', description: 'Funzionalità in arrivo' })}
              >
                <User className="mr-2 h-4 w-4" />
                Profilo
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => toast({ title: 'Impostazioni', description: 'Funzionalità in arrivo' })}
              >
                <Settings className="mr-2 h-4 w-4" />
                Impostazioni
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifiche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-lg">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Nuovo candidato aggiunto</p>
                <p className="text-sm text-muted-foreground">Un nuovo candidato è stato inserito nel sistema</p>
                <p className="text-xs text-muted-foreground mt-1">2 ore fa</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-lg">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Colloquio programmato</p>
                <p className="text-sm text-muted-foreground">Colloquio fissato per domani alle 10:00</p>
                <p className="text-xs text-muted-foreground mt-1">5 ore fa</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-lg">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Aggiornamento sistema</p>
                <p className="text-sm text-muted-foreground">Nuove funzionalità disponibili</p>
                <p className="text-xs text-muted-foreground mt-1">1 giorno fa</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};