import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCandidates, CreateCandidateData } from '@/hooks/useCandidates';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface ImportCandidatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Definisce i campi minimi richiesti per l'importazione
const REQUIRED_FIELDS = ['first_name', 'last_name', 'email'];

export const ImportCandidatesDialog = ({ open, onOpenChange }: ImportCandidatesDialogProps) => {
  const { toast } = useToast();
  const { createCandidate, refetch } = useCandidates();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<CreateCandidateData[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'ready' | 'importing' | 'complete'>('idle');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setImportStatus('parsing');
      parseCSV(selectedFile);
    } else {
      setFile(null);
      setParsedData([]);
      setImportStatus('idle');
      toast({
        title: 'Errore File',
        description: 'Per favore, carica un file CSV valido.',
        variant: 'destructive',
      });
    }
  };

  const parseCSV = (csvFile: File) => {
    setIsParsing(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        setIsParsing(false);
        
        const data = results.data as any[];
        
        // Basic validation: check for required headers
        const headers = results.meta.fields || [];
        const missingFields = REQUIRED_FIELDS.filter(field => !headers.includes(field));

        if (missingFields.length > 0) {
          toast({
            title: 'Errore di Formato',
            description: `Il file CSV deve contenere le colonne: ${REQUIRED_FIELDS.join(', ')}. Mancano: ${missingFields.join(', ')}`,
            variant: 'destructive',
          });
          setImportStatus('idle');
          setFile(null);
          return;
        }

        // Map and clean data
        const candidatesToImport: CreateCandidateData[] = data.map(row => ({
          first_name: row.first_name || '',
          last_name: row.last_name || '',
          email: row.email || '',
          phone: row.phone || undefined,
          position: row.position || undefined,
          company: row.company || undefined,
          experience_years: parseInt(row.experience_years) || undefined,
          skills: row.skills ? (Array.isArray(row.skills) ? row.skills : row.skills.split(',').map((s: string) => s.trim())) : undefined,
          notes: row.notes || undefined,
          status: row.status || 'new',
        })).filter(c => c.first_name && c.last_name && c.email); // Filter out invalid entries

        setParsedData(candidatesToImport);
        setImportStatus('ready');

        if (candidatesToImport.length === 0) {
          toast({
            title: 'Nessun dato valido',
            description: 'Nessun candidato valido trovato nel file CSV.',
            variant: 'destructive',
          });
          setImportStatus('idle');
        } else {
          toast({
            title: 'Parsing completato',
            description: `${candidatesToImport.length} candidati pronti per l'importazione.`,
          });
        }
      },
      error: (error) => {
        setIsParsing(false);
        setImportStatus('idle');
        toast({
          title: 'Errore di Parsing',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImportStatus('importing');
    let successCount = 0;
    let errorCount = 0;

    for (const candidateData of parsedData) {
      const result = await createCandidate(candidateData);
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setImportStatus('complete');
    refetch(); // Ricarica la lista dei candidati

    toast({
      title: 'Importazione completata',
      description: `Aggiunti ${successCount} candidati. Errori: ${errorCount}.`,
      duration: 5000,
    });

    setTimeout(() => {
      onOpenChange(false);
      resetState();
    }, 2000);
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setImportStatus('idle');
    setIsParsing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) resetState();
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importa Candidati da CSV
          </DialogTitle>
          <DialogDescription>
            Carica un file CSV contenente i dati dei candidati. Assicurati che le colonne siano nominate correttamente (es. `first_name`, `last_name`, `email`).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="bg-secondary/30 border-dashed">
            <CardContent className="p-6 space-y-3">
              <div className="text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium">
                  {file ? file.name : 'Trascina o seleziona il file CSV'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Solo file .csv (max 5MB)
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
                disabled={importStatus === 'importing'}
              />
              <div className="flex justify-center">
                <Button
                  asChild
                  variant="outline"
                  disabled={importStatus === 'importing'}
                >
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    {importStatus === 'parsing' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      'Seleziona File CSV'
                    )}
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {importStatus === 'ready' && (
            <div className="space-y-2 p-4 bg-primary-light rounded-lg border border-primary/20">
              <p className="font-medium text-primary">
                {parsedData.length} candidati pronti per l'importazione.
              </p>
              <p className="text-sm text-muted-foreground">
                Clicca su "Avvia Importazione" per aggiungere i candidati al tuo sistema.
              </p>
            </div>
          )}

          {importStatus === 'complete' && (
            <div className="space-y-2 p-4 bg-success-light/50 rounded-lg border border-success/20 text-center">
              <CheckCircle className="h-6 w-6 text-success mx-auto" />
              <p className="font-medium text-success">
                Importazione completata con successo!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importStatus === 'importing'}>
              Annulla
            </Button>
            <Button
              onClick={handleImport}
              disabled={importStatus !== 'ready' || parsedData.length === 0}
            >
              {importStatus === 'importing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importazione...
                </>
              ) : (
                'Avvia Importazione'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};