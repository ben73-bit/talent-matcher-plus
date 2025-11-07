import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Eye,
  GripVertical
} from "lucide-react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCandidates, Candidate } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { EmailModal } from "./EmailModal";

const getStatusBadge = (status: Candidate['status']) => {
  const statusMap = {
    new: { label: 'Nuovo', variant: 'secondary' as const },
    contacted: { label: 'Contattato', variant: 'default' as const },
    interviewed: { label: 'Colloquio', variant: 'outline' as const },
    hired: { label: 'Assunto', variant: 'default' as const },
    rejected: { label: 'Scartato', variant: 'destructive' as const }
  };

  const config = statusMap[status];
  return (
    <Badge variant={config.variant} className={
      status === 'hired' ? 'bg-success text-success-foreground' :
      status === 'contacted' ? 'bg-warning text-warning-foreground' : ''
    }>
      {config.label}
    </Badge>
  );
};

interface CandidateItemProps {
  candidate: Candidate;
  onViewCandidate?: (candidateId: string) => void;
  deleteCandidate: (id: string) => void;
  updateCandidate: (id: string, updates: any) => void;
  emailService: string;
  onEmailClick: (candidate: Candidate) => void;
}

const CandidateItem = ({ candidate, onViewCandidate, deleteCandidate, updateCandidate, emailService, onEmailClick }: CandidateItemProps) => {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Reorder.Item
      value={candidate}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className="mb-4"
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth cursor-pointer group"
          onClick={() => {
            if (!isDragging) {
              onViewCandidate?.(candidate.id);
            }
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div
                  className="cursor-grab active:cursor-grabbing pt-1"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragControls.start(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                <Avatar className="h-12 w-12">
                  <AvatarImage src={candidate.photo_url || undefined} alt={`${candidate.first_name} ${candidate.last_name}`} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium text-lg">
                    {candidate.first_name[0]}{candidate.last_name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-fast">
                      {candidate.first_name} {candidate.last_name}
                    </h3>
                  </div>

                  <p className="text-primary font-medium">{candidate.position || 'Posizione non specificata'}</p>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Mail className="mr-1 h-3 w-3" />
                      {candidate.email}
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center">
                        <Phone className="mr-1 h-3 w-3" />
                        {candidate.phone}
                      </div>
                    )}
                    {candidate.company && (
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {candidate.company}
                      </div>
                    )}
                  </div>

                  {candidate.skills && candidate.skills.length > 0 && (
                    <div className="flex items-center space-x-2 mt-3">
                      <span className="text-sm text-muted-foreground">Competenze:</span>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{candidate.skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right space-y-2">
                  {getStatusBadge(candidate.status)}
                  <div className="text-xs text-muted-foreground">
                    {new Date(candidate.created_at).toLocaleDateString('it-IT')}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewCandidate?.(candidate.id);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizza
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEmailClick(candidate);
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Invia Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'contacted' })}>
                      Segna come Contattato
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'interviewed' })}>
                      Segna come Intervistato
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'hired' })}>
                      Segna come Assunto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateCandidate(candidate.id, { status: 'rejected' })}>
                      Segna come Scartato
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        if (confirm('Sei sicuro di voler eliminare questo candidato?')) {
                          deleteCandidate(candidate.id);
                        }
                      }}
                    >
                      Elimina
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Reorder.Item>
  );
};

interface CandidateListProps {
  onViewCandidate?: (candidateId: string) => void;
  filterDatabaseId?: string | null;
  onClearFilter?: () => void;
}

export const CandidateList = ({ onViewCandidate, filterDatabaseId, onClearFilter }: CandidateListProps) => {
  const { candidates, loading, deleteCandidate, updateCandidate, reorderCandidates, fetchByDatabase } = useCandidates();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("manual");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [orderedCandidates, setOrderedCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    setOrderedCandidates(candidates);
  }, [candidates]);

  // Ricarica i candidati quando cambia il database selezionato
  useEffect(() => {
    if (filterDatabaseId) {
      fetchByDatabase(filterDatabaseId);
    } else {
      fetchByDatabase();
    }
  }, [filterDatabaseId]);

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefono', 'Posizione', 'Status', 'Data'],
      ...candidates.map(c => [
        `${c.first_name} ${c.last_name}`,
        c.email,
        c.phone || '',
        c.position || '',
        c.status,
        new Date(c.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidati_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Esportazione completata',
      description: 'Il file CSV è stato scaricato',
    });
  };

  const handleReorder = (newOrder: Candidate[]) => {
    setOrderedCandidates(newOrder);
    setSortBy("manual"); // Imposta automaticamente l'ordinamento manuale
    reorderCandidates(newOrder);
  };

  const filteredCandidates = orderedCandidates
    .filter(candidate => {
      const fullName = `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
      const position = candidate.position?.toLowerCase() || '';
      const skills = candidate.skills || [];

      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           position.includes(searchTerm.toLowerCase()) ||
                           skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
      const matchesDatabase = !filterDatabaseId || candidate.database_id === filterDatabaseId;
      return matchesSearch && matchesStatus && matchesDatabase;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'manual':
        default:
          // Rispetta l'ordine dal database (order_index)
          return 0;
      }
    });

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
          <h1 className="text-3xl font-bold text-foreground">Candidati</h1>
          <p className="text-muted-foreground">
            Gestisci e visualizza tutti i candidati ({filteredCandidates.length})
            {filterDatabaseId && ' - Database condiviso'}
          </p>
          {filterDatabaseId && onClearFilter && (
            <Button variant="link" onClick={onClearFilter} className="p-0 h-auto text-sm">
              Visualizza tutti i candidati
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button variant="outline" onClick={() => setShowAdvancedFilters(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtri Avanzati
          </Button>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center space-x-4 bg-card p-4 rounded-lg border shadow-soft"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, posizione o competenze..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="new">Nuovi</SelectItem>
            <SelectItem value="contacted">Contattati</SelectItem>
            <SelectItem value="interviewed">Intervistati</SelectItem>
            <SelectItem value="hired">Assunti</SelectItem>
            <SelectItem value="rejected">Scartati</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordina per" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Ordine manuale</SelectItem>
            <SelectItem value="recent">Più recenti</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {loading && (
        <motion.div
          className="flex justify-center items-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </motion.div>
      )}

      {!loading && candidates.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-muted-foreground">Nessun candidato trovato. Aggiungi il tuo primo candidato!</p>
        </motion.div>
      )}

      {!loading && filteredCandidates.length > 0 && (
        <Reorder.Group
          axis="y"
          values={filteredCandidates}
          onReorder={handleReorder}
          className="space-y-0"
        >
          {filteredCandidates.map((candidate) => (
            <CandidateItem
              key={candidate.id}
              candidate={candidate}
              onViewCandidate={onViewCandidate}
              deleteCandidate={deleteCandidate}
              updateCandidate={updateCandidate}
              emailService={profile?.email_service || 'outlook'}
              onEmailClick={(candidate) => {
                setSelectedCandidate(candidate);
                setShowEmailModal(true);
              }}
            />
          ))}
        </Reorder.Group>
      )}

      <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtri Avanzati</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nuovo</SelectItem>
                  <SelectItem value="contacted">Contattato</SelectItem>
                  <SelectItem value="interviewed">Colloquio</SelectItem>
                  <SelectItem value="hired">Assunto</SelectItem>
                  <SelectItem value="rejected">Rifiutato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Posizione</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona posizione" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(candidates.map(c => c.position))).map(pos => (
                    <SelectItem key={pos} value={pos || ''}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => {
              toast({ title: 'Filtri applicati', description: 'I filtri avanzati sono stati applicati' });
              setShowAdvancedFilters(false);
            }}>
              Applica Filtri
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        candidate={selectedCandidate}
        emailService={profile?.email_service || 'outlook'}
      />
    </motion.div>
  );
};
