import {
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { user } = useAuth();
  const { candidates, loading, getStats } = useCandidates();

  const stats = getStats();

  // Ridotto a 3 candidati recenti per densità
  const recentCandidates = candidates.slice(0, 3);

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
      <motion.div
        className="flex justify-center items-center min-h-96"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
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
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { title: "Candidati Totali", value: stats.total, icon: Users, description: "Candidati nel database", color: "text-primary" },
          { title: "Nuovi Candidati", value: stats.new, icon: AlertCircle, description: "Da contattare", color: "text-success" },
          { title: "In Processo", value: stats.contacted + stats.interviewed, icon: Clock, description: "Contattati + Intervistati", color: "text-warning" },
          { title: "Assunti", value: stats.hired, icon: CheckCircle, description: "Assunzioni completate", color: "text-success" }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="lg:col-span-2 bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Candidati Recenti</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('candidates')}
              >
                Visualizza tutti
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCandidates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessun candidato ancora. Aggiungi il tuo primo candidato!
              </p>
            ) : (
              recentCandidates.map((candidate, index) => (
                <motion.div
                  key={candidate.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-fast"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium text-sm shrink-0">
                      {candidate.first_name[0]}{candidate.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{candidate.first_name} {candidate.last_name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {candidate.position || 'N/D'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 shrink-0">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(candidate.status)}
                      <span className="text-xs font-medium">{getStatusLabel(candidate.status)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(candidate.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Aggiungi Candidato", icon: Users, action: 'add-candidate', primary: true },
              { label: "Nuova Posizione", icon: Briefcase, action: 'positions' },
              { label: "Programma Colloquio", icon: Calendar, action: 'interviews' },
              { label: "Report Mensile", icon: TrendingUp, action: 'reports' }
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className={item.primary ? "w-full justify-start bg-gradient-primary hover:opacity-90" : "w-full justify-start"}
                  variant={item.primary ? "default" : "outline"}
                  onClick={() => onNavigate(item.action)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Pipeline Candidati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {[
                { value: stats.new, label: "Nuovi", color: "text-primary" },
                { value: stats.contacted, label: "Contattati", color: "text-warning" },
                { value: stats.interviewed, label: "Intervistati", color: "text-success" },
                { value: stats.hired, label: "Assunti", color: "text-success" },
                { value: stats.rejected, label: "Scartati", color: "text-destructive" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  className="text-center"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.0 + index * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};