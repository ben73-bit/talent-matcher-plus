import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, Briefcase, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useJobPositions, JobPosition, CreateJobPositionData } from '@/hooks/useJobPositions';

interface PositionFormProps {
  initialPosition?: JobPosition;
  onBack: () => void;
  onSave: () => void;
}

export const PositionForm = ({ initialPosition, onBack, onSave }: PositionFormProps) => {
  const { createPosition, updatePosition, isCreating, isUpdating } = useJobPositions();
  const { toast } = useToast();
  const [skillsInput, setSkillsInput] = useState('');
  
  const [formData, setFormData] = useState<CreateJobPositionData>({
    title: initialPosition?.title || '',
    description: initialPosition?.description || '',
    required_skills: initialPosition?.required_skills || [],
    min_experience_years: initialPosition?.min_experience_years || 0,
    max_experience_years: initialPosition?.max_experience_years || 5,
  });

  const isEditMode = !!initialPosition;
  const isSubmitting = isCreating || isUpdating;

  const handleInputChange = (field: keyof CreateJobPositionData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSkill = () => {
    const skill = skillsInput.trim();
    if (skill && !formData.required_skills?.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...(prev.required_skills || []), skill]
      }));
      setSkillsInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills?.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast({ title: 'Errore', description: 'Il titolo della posizione è obbligatorio.', variant: 'destructive' });
      return;
    }

    let result;

    const payload = {
      ...formData,
      min_experience_years: formData.min_experience_years || 0,
      max_experience_years: formData.max_experience_years || 0,
      required_skills: formData.required_skills || [],
    };

    try {
      if (isEditMode && initialPosition) {
        result = await updatePosition({ id: initialPosition.id, updates: payload });
      } else {
        result = await createPosition(payload);
      }
      
      if (result) {
        onSave();
      }
    } catch (error) {
      // Error handling is done inside the hook's mutation onError
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditMode ? 'Modifica Posizione' : 'Crea Nuova Posizione'}
          </h1>
          <p className="text-muted-foreground">
            Definisci il profilo ideale per la tua ricerca
          </p>
        </div>
      </div>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary" />
            Dettagli Posizione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title and Description */}
            <div className="space-y-2">
              <Label htmlFor="title">Posizione Ricercata (Titolo)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Es. Sviluppatore Full Stack Senior"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione / Mansione</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrivi brevemente il ruolo e le responsabilità"
                rows={4}
              />
            </div>

            <Separator />

            {/* Experience Range */}
            <div className="space-y-2">
              <Label>Anni di Esperienza Richiesti</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_experience">Minimo (Anni)</Label>
                  <Input
                    id="min_experience"
                    type="number"
                    value={formData.min_experience_years || 0}
                    onChange={(e) => handleInputChange('min_experience_years', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_experience">Massimo (Anni)</Label>
                  <Input
                    id="max_experience"
                    type="number"
                    value={formData.max_experience_years || 0}
                    onChange={(e) => handleInputChange('max_experience_years', parseInt(e.target.value) || 0)}
                    min={formData.min_experience_years || 0}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Required Skills */}
            <div className="space-y-2">
              <Label>Competenze Ricercate</Label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[30px] border border-dashed border-border p-2 rounded-md">
                {formData.required_skills?.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    className="cursor-pointer bg-primary hover:bg-primary/80"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Aggiungi competenza richiesta (es. React, SQL)"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSkill}
                >
                  Aggiungi
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Queste competenze saranno utilizzate per calcolare il livello di corrispondenza.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Salva Modifiche' : 'Crea Posizione'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};