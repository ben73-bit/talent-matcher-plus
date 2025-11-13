import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, User, Mail, Link, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCandidates, Candidate } from '@/hooks/useCandidates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

interface ScheduleInterviewProps {
  onBack: () => void;
}

// Funzione per generare il link di Google Calendar
const generateGoogleCalendarLink = (
  candidate: Candidate,
  date: Date,
  durationMinutes: number,
  location: string,
  description: string
) => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
  
  // Convert date to zoned time and format for Google Calendar (YYYYMMDDTHHMMSSZ)
  const zonedStart = toZonedTime(date, timeZone);
  const end = new Date(date.getTime() + durationMinutes * 60000);
  const zonedEnd = toZonedTime(end, timeZone);

  const formatGoogleDate = (d: Date) => format(d, "yyyyMMdd'T'HHmmss", { locale: it });

  const dates = `${formatGoogleDate(zonedStart)}/${formatGoogleDate(zonedEnd)}`;
  
  const text = `Colloquio con ${candidate.first_name} ${candidate.last_name} - ${candidate.position || 'Candidato'}`;
  
  const details = `Dettagli Candidato:\nEmail: ${candidate.email}\nTelefono: ${candidate.phone || 'N/D'}\n\nNote Colloquio:\n${description}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: text,
    dates: dates,
    details: details,
    location: location,
    add: candidate.email, // Aggiunge il candidato come invitato
    ctz: timeZone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const ScheduleInterview = ({ onBack }: ScheduleInterviewProps) => {
  const { candidates, loading, updateCandidate } = useCandidates();
  const { toast } = useToast();
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [dateString, setDateString] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeString, setTimeString] = useState(format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('Online (Google Meet/Zoom)');
  const [calendarLink, setCalendarLink] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      toast({ title: 'Errore', description: 'Seleziona un candidato valido.', variant: 'destructive' });
      return;
    }
    
    if (!location.trim()) {
      toast({ title: 'Errore', description: 'Il luogo del colloquio è obbligatorio.', variant: 'destructive' });
      return;
    }

    try {
      const dateTimeString = `${dateString}T${timeString}:00`;
      const interviewDate = parseISO(dateTimeString);
      const durationMinutes = parseInt(duration);

      if (isNaN(interviewDate.getTime()) || isNaN(durationMinutes)) {
        throw new Error('Data, ora o durata non validi.');
      }

      const link = generateGoogleCalendarLink(
        selectedCandidate,
        interviewDate,
        durationMinutes,
        location,
        description
      );
      
      setCalendarLink(link);
      
      // Open the link immediately
      window.open(link, '_blank');

      // 1. Update candidate status to 'interviewed'
      await updateCandidate(selectedCandidate.id, { status: 'interviewed' }); 

      toast({
        title: 'Link Calendario Generato',
        description: 'Apri il link per confermare l\'appuntamento su Google Calendar. Lo stato del candidato è stato aggiornato a "Colloquio".',
      });

    } catch (error) {
      console.error('Scheduling error:', error);
      toast({ title: 'Errore di Pianificazione', description: 'Impossibile generare il link del calendario.', variant: 'destructive' });
    }
  };

  // Determina il valore selezionato nel dropdown in base al testo attuale del luogo
  const getLocationSelectValue = () => {
    if (location.toLowerCase().includes('online') || location.toLowerCase().includes('meet') || location.toLowerCase().includes('zoom')) {
      return 'online';
    }
    if (location.toLowerCase().includes('ufficio') || location.toLowerCase().includes('sede') || location.toLowerCase().includes('presenza')) {
      return 'in_person';
    }
    return 'custom';
  };

  const handleCalendarPreview = () => {
    try {
      // Estrae anno, mese e giorno dalla stringa YYYY-MM-DD
      const [year, month, day] = dateString.split('-');
      
      // Modifica il link per aprire la visualizzazione mensile (/r/month/)
      // Usiamo il giorno 01 per assicurare che il mese sia centrato correttamente, anche se Google Calendar è flessibile.
      const previewLink = `https://calendar.google.com/calendar/r/month/${year}/${month}/01`;
      window.open(previewLink, '_blank');
    } catch (e) {
      toast({ title: 'Errore', description: 'Data non valida per l\'anteprima del calendario.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pianifica Colloquio</h1>
          <p className="text-muted-foreground">
            Genera un link per fissare un appuntamento su Google Calendar
          </p>
        </div>
      </div>

      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
            Dettagli Colloquio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSchedule} className="space-y-6">
            
            {/* Candidate Selection */}
            <div className="space-y-2">
              <Label htmlFor="candidate">Candidato</Label>
              <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId} disabled={loading}>
                <SelectTrigger id="candidate">
                  <SelectValue placeholder="Seleziona un candidato" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.position || 'N/D'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCandidate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3" />
                  {selectedCandidate.email}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateString}
                  onChange={(e) => setDateString(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Ora</Label>
                <Input
                  id="time"
                  type="time"
                  value={timeString}
                  onChange={(e) => setTimeString(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durata (minuti)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Durata" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minuti</SelectItem>
                    <SelectItem value="45">45 minuti</SelectItem>
                    <SelectItem value="60">60 minuti</SelectItem>
                    <SelectItem value="90">90 minuti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Calendar Preview Button */}
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCalendarPreview}
              className="w-full"
            >
              <Eye className="mr-2 h-4 w-4" />
              Anteprima Calendario (Visualizzazione Mese)
            </Button>

            {/* Location Type Select */}
            <div className="space-y-2">
              <Label htmlFor="location-select">Tipo di Luogo</Label>
              <Select 
                value={getLocationSelectValue()} 
                onValueChange={(value) => {
                  if (value === 'online') {
                    setLocation('Online (Google Meet/Zoom)');
                  } else if (value === 'in_person') {
                    setLocation('Ufficio / Sede Aziendale');
                  }
                }}
              >
                <SelectTrigger id="location-select">
                  <SelectValue placeholder="Seleziona tipo di luogo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_person">In presenza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Details Input */}
            <div className="space-y-2">
              <Label htmlFor="location-input">Dettagli Luogo</Label>
              <Input
                id="location-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Es. Link Google Meet, Indirizzo Ufficio"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Note/Descrizione</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Aggiungi dettagli sul colloquio, agenda, ecc."
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!selectedCandidateId || !location.trim()}>
              <Link className="mr-2 h-4 w-4" />
              Genera Link Google Calendar
            </Button>
          </form>
        </CardContent>
      </Card>

      {calendarLink && (
        <Card className="bg-primary-light border-primary/20 shadow-soft">
          <CardContent className="p-4 space-y-2">
            <p className="font-medium text-primary">Link Generato con Successo</p>
            <a 
              href={calendarLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-primary/80 hover:underline flex items-center gap-2 break-all"
            >
              Clicca qui per aprire il calendario
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              Nota: Questo metodo apre il tuo calendario Google predefinito. Per la selezione di più calendari, è necessaria una configurazione API avanzata (OAuth).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};