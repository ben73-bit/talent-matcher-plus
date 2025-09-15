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

const stats = [
  {
    title: "Candidati Totali",
    value: "247",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-primary"
  },
  {
    title: "Posizioni Aperte", 
    value: "12",
    change: "+3",
    trend: "up",
    icon: Briefcase,
    color: "text-success"
  },
  {
    title: "Colloqui Oggi",
    value: "8",
    change: "2 completati",
    trend: "neutral",
    icon: Calendar,
    color: "text-warning"
  },
  {
    title: "Tasso Conversione",
    value: "23%",
    change: "+5%",
    trend: "up", 
    icon: TrendingUp,
    color: "text-primary"
  }
];

const recentCandidates = [
  {
    id: 1,
    name: "Marco Rossi",
    position: "Frontend Developer",
    status: "interview",
    score: 85,
    applied: "2 ore fa"
  },
  {
    id: 2,
    name: "Laura Bianchi",
    position: "UX Designer", 
    status: "review",
    score: 92,
    applied: "1 giorno fa"
  },
  {
    id: 3,
    name: "Alessandro Verde",
    position: "Backend Developer",
    status: "hired",
    score: 88,
    applied: "3 giorni fa"
  },
  {
    id: 4,
    name: "Sofia Neri",
    position: "Product Manager",
    status: "rejected",
    score: 65,
    applied: "5 giorni fa"
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'hired':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'interview':
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
    case 'interview':
      return 'Colloquio';
    case 'review':
      return 'In Revisione';
    default:
      return 'Nuovo';
  }
};

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Benvenuto nel tuo sistema di gestione candidati
          </p>
        </div>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Oggi, 15 Settembre
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {stat.trend === 'up' && (
                    <TrendingUp className="mr-1 h-3 w-3 text-success" />
                  )}
                  <span>{stat.change} dal mese scorso</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
            {recentCandidates.map((candidate) => (
              <div key={candidate.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-fast">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{candidate.name}</h4>
                    <p className="text-sm text-muted-foreground">{candidate.position}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(candidate.status)}
                      <span className="text-sm font-medium">{getStatusLabel(candidate.status)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{candidate.applied}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{candidate.score}%</div>
                    <Progress value={candidate.score} className="w-16 h-2" />
                  </div>
                </div>
              </div>
            ))}
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
              <div className="text-2xl font-bold text-primary">45</div>
              <div className="text-sm text-muted-foreground">Nuovi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">32</div>
              <div className="text-sm text-muted-foreground">Screening</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">18</div>
              <div className="text-sm text-muted-foreground">Colloquio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground">Finale</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">12</div>
              <div className="text-sm text-muted-foreground">Assunti</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};