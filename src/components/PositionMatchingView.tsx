import { useState, useMemo } from 'react';
import { ArrowLeft, Briefcase, Users, Zap, CheckCircle, XCircle, TrendingUp, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCandidates, Candidate } from '@/hooks/useCandidates';
import { useJobPositions, JobPosition } from '@/hooks/useJobPositions';
import { cn } from '@/lib/utils';

interface PositionMatchingViewProps {
  position: JobPosition;
  onBack: () => void;
}

// --- Matching Logic ---
const calculateMatchScore = (candidate: Candidate, position: JobPosition): number => {
  const requiredSkills = position.required_skills || [];
  const candidateSkills = candidate.skills || [];
  const minExp = position.min_experience_years || 0;
  const maxExp = position.max_experience_years || Infinity;
  const candidateExp = candidate.experience_years || 0;

  // 1. Skill Match (70% weight)
  let skillMatchScore = 0;
  if (requiredSkills.length > 0) {
    const matchedSkills = candidateSkills.filter(skill => 
      requiredSkills.some(reqSkill => skill.toLowerCase() === reqSkill.toLowerCase())
    ).length;
    skillMatchScore = (matchedSkills / requiredSkills.length) * 100;
  } else {
    // If no required skills, assume 100% match on skills
    skillMatchScore = 100;
  }

  // 2. Experience Match (30% weight)
  let experienceMatchScore = 0;
  if (candidateExp >= minExp && candidateExp <= maxExp) {
    experienceMatchScore = 100; // Perfect match
  } else if (candidateExp < minExp) {
    // Partial score if slightly below min (e.g., within 1 year)
    if (minExp > 0 && candidateExp >= minExp - 1) {
      experienceMatchScore = 50;
    } else {
      experienceMatchScore = 0;
    }
  } else if (candidateExp > maxExp) {
    // Partial score if slightly above max (overqualified, but still a match)
    if (maxExp !== Infinity && candidateExp <= maxExp + 2) {
      experienceMatchScore = 70;
    } else {
      experienceMatchScore = 50;
    }
  }

  // 3. Weighted Total Score
  const totalScore = (skillMatchScore * 0.7) + (experienceMatchScore * 0.3);
  return Math.round(totalScore);
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-destructive';
};

const CandidateMatchItem = ({ candidate, score }: { candidate: Candidate, score: number }) => {
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`.toUpperCase();
  
  // NOTE: This component relies on 'position' being defined in the outer scope, 
  // which is passed to PositionMatchingView.
  // We need to ensure 'position' is accessible here, or passed down.
  // Since CandidateMatchItem is defined inside PositionMatchingView, it has access to 'position'.
  
  const requiredSkills = candidate.skills || [];
  const matchedSkills = requiredSkills.filter(skill => 
    position.required_skills?.some(reqSkill => skill.toLowerCase() === reqSkill.toLowerCase())
  );

  return (
    <Card className="p-4 shadow-soft hover:shadow-medium transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold text-lg">{candidate.first_name} {candidate.last_name}</h4>
            <p className="text-sm text-muted-foreground">{candidate.position || 'N/D'}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs font-medium text-muted-foreground mb-1">Corrispondenza</p>
          <div className="text-2xl font-bold text-foreground">
            {score}%
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Esperienza:</span>
          <span className="font-medium">
            {candidate.experience_years || 0} anni
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Stato:</span>
          <Badge variant="secondary">{candidate.status}</Badge>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium mb-2">Competenze Corrispondenti ({matchedSkills.length}/{requiredSkills.length})</p>
        <div className="flex flex-wrap gap-2">
          {requiredSkills.map((skill, index) => {
            const isMatch = matchedSkills.includes(skill);
            return (
              <Badge 
                key={index} 
                variant={isMatch ? 'default' : 'outline'}
                className={cn(
                  "text-xs",
                  isMatch ? "bg-primary text-primary-foreground" : "border-muted-foreground text-muted-foreground"
                )}
              >
                {skill}
              </Badge>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export const PositionMatchingView = ({ position, onBack }: PositionMatchingViewProps) => {
  const { candidates, loading: candidatesLoading } = useCandidates();

  const rankedCandidates = useMemo(() => {
    if (candidatesLoading || !position) return [];

    const candidatesWithScore = candidates.map(candidate => ({
      candidate,
      score: calculateMatchScore(candidate, position),
    }));

    // Sort by score descending
    return candidatesWithScore.sort((a, b) => b.score - a.score);
  }, [candidates, candidatesLoading, position]);

  if (candidatesLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Corrispondenza Candidati
          </h1>
          <p className="text-muted-foreground">
            Risultati di matching per la posizione: <span className="font-medium text-primary">{position.title}</span>
          </p>
        </div>
      </div>

      <Card className="bg-primary-light border-primary/20 shadow-soft">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center space-x-3 text-primary">
            <Briefcase className="h-5 w-5" />
            <p className="font-medium">Requisiti Posizione</p>
          </div>
          <p className="text-sm text-primary/80">
            Esperienza richiesta: {position.min_experience_years || 0} - {position.max_experience_years || '∞'} anni.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {position.required_skills?.map((skill, index) => (
              <Badge key={index} variant="default" className="bg-primary/80 text-primary-foreground text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Candidati Classificati ({rankedCandidates.length})
      </h2>

      <div className="space-y-4">
        {rankedCandidates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nessun candidato trovato o caricato.</p>
          </div>
        ) : (
          rankedCandidates.map(({ candidate, score }) => (
            <CandidateMatchItem key={candidate.id} candidate={candidate} score={score} />
          ))
        )}
      </div>
    </div>
  );
};