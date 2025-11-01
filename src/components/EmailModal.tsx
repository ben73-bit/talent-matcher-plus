import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Copy, Check } from 'lucide-react';
import { Candidate } from '@/hooks/useCandidates';

interface EmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  emailService: string;
}

export const EmailModal = ({
  open,
  onOpenChange,
  candidate,
  emailService,
}: EmailModalProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!candidate) return null;

  const handleOutlookClick = () => {
    const mailto = `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onOpenChange(false);
    toast({
      title: 'Email aperta',
      description: 'Outlook si aprirà con il tuo messaggio',
    });
  };

  const handleCopyToClipboard = async () => {
    const emailContent = `To: ${candidate.email}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(emailContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copiato',
        description: 'Email copiata negli appunti',
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile copiare negli appunti',
        variant: 'destructive',
      });
    }
  };

  const handleSendViaApi = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Errore',
        description: 'Compila tutti i campi',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: candidate.email,
            subject,
            body,
            candidateName: `${candidate.first_name} ${candidate.last_name}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Errore nell\'invio della email');
      }

      toast({
        title: 'Successo',
        description: 'Email inviata con successo',
      });

      setSubject('');
      setBody('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile inviare l\'email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invia Email a {candidate.first_name} {candidate.last_name}</DialogTitle>
          <DialogDescription>
            Email: {candidate.email}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="space-y-2">
            <Label htmlFor="email-subject">Oggetto</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Titolo della email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Messaggio</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Scrivi il tuo messaggio..."
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Metodo di invio: {
              emailService === 'outlook' ? 'Outlook (mailto)' :
              emailService === 'browser' ? 'Browser (Composizione)' :
              'Gmail (API)'
            }</p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>

            {emailService === 'outlook' && (
              <Button
                onClick={handleOutlookClick}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Apri Outlook
              </Button>
            )}

            {emailService === 'browser' && (
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiato' : 'Copia Email'}
              </Button>
            )}

            {emailService === 'gmail' && (
              <Button
                onClick={handleSendViaApi}
                disabled={isLoading}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isLoading ? 'Invio...' : 'Invia Email'}
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
