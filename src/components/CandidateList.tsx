import { useState } from "react";
import { 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Star,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  location: string;
  experience: string;
  skills: string[];
  status: 'new' | 'screening' | 'interview' | 'hired' | 'rejected';
  score: number;
  appliedDate: string;
  rating: number;
}

const mockCandidates: Candidate[] = [
  {
    id: 1,
    name: "Marco Rossi",
    email: "marco.rossi@email.com",
    phone: "+39 123 456 7890",
    position: "Frontend Developer",
    location: "Milano, IT",
    experience: "5+ anni",
    skills: ["React", "TypeScript", "Next.js", "CSS"],
    status: "interview",
    score: 85,
    appliedDate: "2024-09-14",
    rating: 4
  },
  {
    id: 2,
    name: "Laura Bianchi",
    email: "laura.bianchi@email.com", 
    phone: "+39 098 765 4321",
    position: "UX Designer",
    location: "Roma, IT",
    experience: "3+ anni",
    skills: ["Figma", "Adobe XD", "User Research", "Prototyping"],
    status: "screening",
    score: 92,
    appliedDate: "2024-09-13",
    rating: 5
  },
  {
    id: 3,
    name: "Alessandro Verde",
    email: "alessandro.verde@email.com",
    phone: "+39 111 222 3333",
    position: "Backend Developer", 
    location: "Torino, IT",
    experience: "7+ anni",
    skills: ["Python", "Django", "PostgreSQL", "Docker"],
    status: "hired",
    score: 88,
    appliedDate: "2024-09-10",
    rating: 4
  },
  {
    id: 4,
    name: "Sofia Neri",
    email: "sofia.neri@email.com",
    phone: "+39 444 555 6666", 
    position: "Product Manager",
    location: "Napoli, IT",
    experience: "4+ anni",
    skills: ["Strategy", "Analytics", "Agile", "Leadership"],
    status: "new",
    score: 78,
    appliedDate: "2024-09-12",
    rating: 4
  },
  {
    id: 5,
    name: "Luca Gialli",
    email: "luca.gialli@email.com",
    phone: "+39 777 888 9999",
    position: "DevOps Engineer",
    location: "Bologna, IT", 
    experience: "6+ anni",
    skills: ["AWS", "Kubernetes", "Terraform", "CI/CD"],
    status: "interview",
    score: 90,
    appliedDate: "2024-09-11",
    rating: 5
  }
];

const getStatusBadge = (status: Candidate['status']) => {
  const statusMap = {
    new: { label: 'Nuovo', variant: 'secondary' as const },
    screening: { label: 'Screening', variant: 'default' as const },
    interview: { label: 'Colloquio', variant: 'outline' as const },
    hired: { label: 'Assunto', variant: 'default' as const },
    rejected: { label: 'Scartato', variant: 'destructive' as const }
  };
  
  const config = statusMap[status];
  return (
    <Badge variant={config.variant} className={
      status === 'hired' ? 'bg-success text-success-foreground' :
      status === 'screening' ? 'bg-warning text-warning-foreground' : ''
    }>
      {config.label}
    </Badge>
  );
};

interface CandidateListProps {
  onViewCandidate?: (candidateId: number) => void;
}

export const CandidateList = ({ onViewCandidate }: CandidateListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const filteredCandidates = mockCandidates
    .filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
        default:
          return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidati</h1>
          <p className="text-muted-foreground">
            Gestisci e visualizza tutti i candidati ({filteredCandidates.length})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtri Avanzati
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-card p-4 rounded-lg border shadow-soft">
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
            <SelectItem value="screening">In Screening</SelectItem>
            <SelectItem value="interview">Colloquio</SelectItem>
            <SelectItem value="hired">Assunti</SelectItem>
            <SelectItem value="rejected">Scartati</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordina per" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Più recenti</SelectItem>
            <SelectItem value="score">Punteggio</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Candidates Grid */}
      <div className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-smooth cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium text-lg">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  {/* Main Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-fast">
                        {candidate.name}
                      </h3>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < candidate.rating 
                                ? 'text-warning fill-current' 
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-primary font-medium">{candidate.position}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Mail className="mr-1 h-3 w-3" />
                        {candidate.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="mr-1 h-3 w-3" />
                        {candidate.phone}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {candidate.location}
                      </div>
                    </div>
                    
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
                  </div>
                </div>
                
                {/* Right Side */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{candidate.score}%</div>
                    <div className="text-xs text-muted-foreground">Match</div>
                  </div>
                  
                  <div className="text-right space-y-2">
                    {getStatusBadge(candidate.status)}
                    <div className="text-xs text-muted-foreground">
                      {new Date(candidate.appliedDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewCandidate?.(candidate.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizza
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Invia Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Modifica Stato
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Elimina
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};