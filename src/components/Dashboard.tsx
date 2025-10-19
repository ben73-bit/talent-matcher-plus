import { useState } from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCandidates } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { DashboardCharts } from './DashboardCharts';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { user } = useAuth();
  const { candidates, loading, getStats } = useCandidates();
  const [showCharts, setShowCharts] = useState(true);
  const [showPipeline, setShowPipeline] = useState(true);

  const stats = getStats();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Benvenuto{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''} nel tuo sistema di gestione candidati
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch id="charts" checked={showCharts} onCheckedChange={setShowCharts} />
            <Label htmlFor="charts" className="cursor-pointer">Grafici</Label>
          </div>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {new Date().toLocaleDateString('it-IT', {
              day: 'numeric',
              month: 'long'
            })}
          </Button>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {[
          { title: 'Candidati Totali', value: stats.total, icon: Users, color: 'text-primary', desc: 'Candidati nel database', delay: 0.1 },
          { title: 'Nuovi Candidati', value: stats.new, icon: AlertCircle, color: 'text-success', desc: 'Da contattare', delay: 0.2 },
          { title: 'In Processo', value: stats.contacted + stats.interviewed, icon: Clock, color: 'text-warning', desc: 'Contattati + Intervistati', delay: 0.3 },
          { title: 'Assunti', value: stats.hired, icon: CheckCircle, color: 'text-success', desc: 'Assunzioni completate', delay: 0.4 }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: stat.delay }}
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
                  <span>{stat.desc}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <CardContent className="space-y-4">
            {recentCandidates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessun candidato ancora. Aggiungi il tuo primo candidato!
              </p>
            ) : (
              recentCandidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-fast cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-4">
                    {candidate.photo_url ? (
                      <img
                        src={candidate.photo_url}
                        alt={`${candidate.first_name} ${candidate.last_name}`}
                        className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
                        {candidate.first_name[0]}{candidate.last_name[0]}
                      </div>
                    )}
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
            <Button
              className="w-full justify-start bg-gradient-primary hover:opacity-90"
              onClick={() => onNavigate('add-candidate')}
            >
              <Users className="mr-2 h-4 w-4" />
              Aggiungi Candidato
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('positions')}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Nuova Posizione
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('interviews')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Programma Colloquio
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onNavigate('reports')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Report Mensile
            </Button>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showCharts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardCharts candidates={candidates} />
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader className="cursor-pointer" onClick={() => setShowPipeline(!showPipeline)}>
          <CardTitle className="flex items-center justify-between">
            <span>Pipeline Candidati</span>
            {showPipeline ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {showPipeline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};
