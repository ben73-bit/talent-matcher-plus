import { useState } from 'react';
import { Briefcase, Plus, Search, Trash2, Edit, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useJobPositions, JobPosition } from '@/hooks/useJobPositions';
import { PositionForm } from './PositionForm';
import { PositionMatchingView } from './PositionMatchingView';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewState = 'list' | 'create' | 'edit' | 'match';

export const PositionManager = () => {
  const { positions, loading, deletePosition, refetch } = useJobPositions();
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>('list');
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleEdit = (position: JobPosition) => {
    setSelectedPosition(position);
    setView('edit');
  };

  const handleMatch = (position: JobPosition) => {
    setSelectedPosition(position);
    setView('match');
  };

  const handleDelete = async () => {
    if (selectedPosition) {
      await deletePosition(selectedPosition.id);
      setShowDeleteDialog(false);
      setSelectedPosition(null);
    }
  };

  const handleBackToList = () => {
    setSelectedPosition(null);
    setView('list');
    refetch();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (view === 'create' || view === 'edit') {
    return (
      <PositionForm 
        initialPosition={view === 'edit' ? selectedPosition || undefined : undefined}
        onBack={handleBackToList}
        onSave={handleBackToList}
      />
    );
  }

  if (view === 'match' && selectedPosition) {
    return (
      <PositionMatchingView
        position={selectedPosition}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" />
            Posizioni Lavorative
          </h1>
          <p className="text-muted-foreground">
            Gestisci i profili di ricerca e trova i candidati ideali.
          </p>
        </div>
        <Button onClick={() => setView('create')}>
          <Plus className="mr-2 h-4 w-4" />
          Crea Nuova Posizione
        </Button>
      </div>

      <Separator />

      {positions.length === 0 ? (
        <Card className="text-center py-12 shadow-soft border-dashed">
          <CardContent className="space-y-3">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <p className="text-lg font-medium">Nessuna posizione creata</p>
            <p className="text-muted-foreground">
              Inizia creando un profilo di ricerca per trovare i candidati corrispondenti.
            </p>
            <Button onClick={() => setView('create')}>
              Crea Posizione Ora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((position) => (
            <Card key={position.id} className="shadow-soft hover:shadow-medium transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{position.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {position.description || 'Nessuna descrizione fornita.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    Esperienza:
                  </span>
                  <span className="font-medium text-foreground">
                    {position.min_experience_years || 0} - {position.max_experience_years || '∞'} anni
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {position.required_skills?.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {(position.required_skills?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(position.required_skills?.length || 0) - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2 border-t border-border/50">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleMatch(position)}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Trova Match
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleEdit(position)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => {
                    setSelectedPosition(position);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione eliminerà permanentemente la posizione "{selectedPosition?.title}". Non potrai più recuperarla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};