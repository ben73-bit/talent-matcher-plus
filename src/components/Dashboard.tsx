import { 
  Users, 
  Briefcase, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";

export const Dashboard = () => {
  const { user } = useAuth();
  const { candidates, loading, getStats } = useCandidates();
  
  const stats = getStats();
  
  // Get recent candidates (last 4)
  const recentCandidates = candidates.slice(0, 4);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'interviewed':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'hired':
        return 'Assunto';
      case 'rejected':
        return 'Scartato';
      case 'interviewed':
        return 'Intervistato';
      case 'contacted':
        return 'Contattato';
      default:
        return 'Nuovo';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Benvenuto{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''} nel tuo sistema di gestione candidati
          </p>
        </div>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          {new Date().toLocaleDateString('it-IT', { 
            day: 'numeric', 
            month: 'long'
          })}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Candidati Totali
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Candidati nel database</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nuovi Candidati
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.new}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Da contattare</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Processo
            </CardTitle>
            <Clock className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.contacted + stats.interviewed}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Contattati + Intervistati</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assunti
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.hired}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Assunzioni completate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Candidates */}
        <Card className="lg:col-span-2 bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Candidati Recenti</span>
              <Button variant="outline" size="sm">
                Visualizza tutti
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCandidates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessun candidato ancora. Aggiungi il tuo primo candidato!
              </p>
            ) : (
              recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-fast">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                      {candidate.first_name[0]}{candidate.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{candidate.first_name} {candidate.last_name}</h4>
                      <p className="text-sm text-muted-foreground">{candidate.position || 'Posizione non specificata'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(candidate.status)}
                        <span className="text-sm font-medium">{getStatusLabel(candidate.status)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(candidate.created_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-gradient-primary hover:opacity-90">
              <Users className="mr-2 h-4 w-4" />
              Aggiungi Candidato
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Briefcase className="mr-2 h-4 w-4" />
              Nuova Posizione
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Programma Colloquio
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Report Mensile
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Pipeline Candidati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.new}</div>
              <div className="text-sm text-muted-foreground">Nuovi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{stats.contacted}</div>
              <div className="text-sm text-muted-foreground">Contattati</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.interviewed}</div>
              <div className="text-sm text-muted-foreground">Intervistati</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{stats.hired}</div>
              <div className="text-sm text-muted-foreground">Assunti</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Scartati</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};