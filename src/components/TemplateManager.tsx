import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const TemplateManager = () => {
    const { toast } = useToast();
    const handleDownloadCsv = () => {
        const headers = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "position",
            "company",
            "experience_years",
            "skills",
            "notes",
            "status",
            "created_at"
        ];

        const exampleRow = [
            "Mario",
            "Rossi",
            "mario.rossi@example.com",
            "+39 333 1234567",
            "Frontend Developer",
            "Tech Solutions Srl",
            "5",
            "React;TypeScript;Tailwind",
            "Ottimo profilo, disponibile da subito",
            "hired",
            new Date().toISOString()
        ];

        const csvContent = [
            headers.join(","),
            exampleRow.join(",")
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "modello_importazione_candidati.csv");
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Template</h2>
                <p className="text-muted-foreground">
                    Gestisci e scarica i modelli per le tue attività.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileSpreadsheet className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Modello CSV Importazione</CardTitle>
                        </div>
                        <CardDescription>
                            Template per l'importazione massiva di candidati
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                                Scarica questo file CSV pre-formattato per importare correttamente i candidati nel sistema.
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Non modificare l'intestazione delle colonne</li>
                                <li><strong>skills:</strong> separa le competenze con punto e virgola (;)</li>
                                <li><strong>created_at:</strong> usa formato ISO (YYYY-MM-DDTHH:MM:SS.sssZ)</li>
                                <li><strong>experience_years:</strong> inserisci solo numeri</li>
                            </ul>
                        </div>
                        <Button
                            onClick={handleDownloadCsv}
                            className="w-full"
                            variant="outline"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Scarica Modello CSV
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Copy className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Prompt Estrazione Dati CV</CardTitle>
                        </div>
                        <CardDescription>
                            Prompt per estrarre dati strutturati dai CV con AI
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                                Copia questo prompt e usalo con il tuo assistente AI preferito per analizzare i CV e ottenere i dati nel formato corretto.
                            </p>
                            <div className="relative">
                                <pre className="p-4 rounded-lg bg-muted text-xs overflow-x-auto whitespace-pre-wrap font-mono h-48 border">
                                    {`Analizza uno o più curriculum vitae che ti fornirò, in qualsiasi formato (PDF, testo o immagine) e in qualsiasi lingua.
Estrai i dati necessari per popolare il file CSV della mia applicazione ATS, rispettando esattamente i seguenti campi e lo stesso ordine delle colonne:

first_name
last_name
email
phone
position
company
experience_years
skills
notes
status
created_at

Regole essenziali:
- non modificare i nomi delle colonne
- lascia vuoto ciò che non trovi
- “skills” → separa le competenze con “;”
- “company” → ultima azienda principale (se deducibile)
- “experience_years” → anni totali di esperienza (se deducibili)
- “notes” → riassumi il CV in 3–5 frasi sintetiche ma esaustive
- “created_at” → usa formato ISO (es: 2025-01-01T10:00:00Z)

Restituisci sempre l’output in una tabella, con la prima riga contenente i nomi delle colonne.`}
                                </pre>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(`Analizza uno o più curriculum vitae che ti fornirò, in qualsiasi formato (PDF, testo o immagine) e in qualsiasi lingua.
Estrai i dati necessari per popolare il file CSV della mia applicazione ATS, rispettando esattamente i seguenti campi e lo stesso ordine delle colonne:

first_name
last_name
email
phone
position
company
experience_years
skills
notes
status
created_at

Regole essenziali:
- non modificare i nomi delle colonne
- lascia vuoto ciò che non trovi
- “skills” → separa le competenze con “;”
- “company” → ultima azienda principale (se deducibile)
- “experience_years” → anni totali di esperienza (se deducibili)
- “notes” → riassumi il CV in 3–5 frasi sintetiche ma esaustive
- “created_at” → usa formato ISO (es: 2025-01-01T10:00:00Z)

Restituisci sempre l’output in una tabella, con la prima riga contenente i nomi delle colonne.`);
                                toast({
                                    title: "Prompt copiato negli appunti",
                                });
                            }}
                            className="w-full"
                            variant="outline"
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copia Prompt
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
