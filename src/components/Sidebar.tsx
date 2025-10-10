import { 
  Home, 
  Users, 
  Briefcase, 
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  candidatesCount?: number;
}

export const Sidebar = ({ activeTab, onTabChange, candidatesCount = 0 }: SidebarProps) => {
  const navigation = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', badge: null },
    { id: 'candidates', icon: Users, label: 'Candidati', badge: candidatesCount > 0 ? candidatesCount.toString() : null },
    { id: 'positions', icon: Briefcase, label: 'Posizioni', badge: '12' },
    { id: 'interviews', icon: Calendar, label: 'Colloqui', badge: '8' },
    { id: 'reports', icon: BarChart3, label: 'Report', badge: null },
    { id: 'templates', icon: FileText, label: 'Template', badge: null },
  ];
  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      <div className="p-6">
        <Button 
          className="w-full bg-gradient-primary hover:opacity-90 transition-fast"
          onClick={() => onTabChange('add-candidate')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Candidato
        </Button>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start transition-fast ${
                isActive 
                  ? 'bg-accent text-accent-foreground shadow-soft' 
                  : 'hover:bg-secondary/50'
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onTabChange('settings')}
        >
          <Settings className="mr-3 h-4 w-4" />
          Impostazioni
        </Button>
      </div>
    </div>
  );
};