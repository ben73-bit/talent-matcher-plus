import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use a stable model for document parsing
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Esegue un semplice test di connettività all'API di Google AI.
 * @param apiKey La chiave API di Google AI.
 * @throws {Error} Se la connessione o la chiave API non sono valide.
 */
async function runDiagnosticTest(apiKey: string) {
  console.log('Running Google AI connectivity diagnostic test...');
  
  const testResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Say 'OK'" }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 5 },
    }),
  });

  if (!testResponse.ok) {
    const errorBody = await testResponse.text();
    console.error('Diagnostic Test Failed. Status:', testResponse.status, 'Body:', errorBody);
    throw new Error(`Connessione API Google AI fallita (Status ${testResponse.status}). Verifica la validità della chiave API e le restrizioni di rete/fatturazione. Dettagli: ${errorBody.substring(0, 100)}...`);
  }
  console.log('Diagnostic Test Successful. Proceeding with CV parsing.');
}

/**
 * Codifica un Uint8Array in una stringa Base64 in modo robusto, gestendo array di grandi dimensioni.
 * @param bytes Uint8Array del file binario.
 * @returns Stringa Base64.
 */
function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  // Chunk size to prevent stack overflow on String.fromCharCode.apply
  const chunkSize = 16384; 

  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting CV parsing request');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Convert file to base64 for document parsing
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    const base64String = base64Encode(bytes);

    console.log('File converted to base64, length:', base64String.length);

    // Use Google AI (Gemini) to analyze the PDF directly
    const googleAIApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    let parsedData;

    if (!googleAIApiKey) {
      console.log('Google AI API key not configured, using fallback parsing');
      // Extract text for fallback
      const textContent = await extractTextFromPDF(arrayBuffer);
      parsedData = await fallbackParsing(textContent, file.name);
    } else {
      // --- DIAGNOSTIC CHECK ---
      await runDiagnosticTest(googleAIApiKey);
      // ------------------------
      
      try {
        console.log(`Sending PDF to Google AI (${GEMINI_MODEL}) for analysis`);

        // FIX: Correctly interpolate the API key variable
        const response = await fetch(`${GEMINI_API_URL}?key=${googleAIApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Sei un esperto nell'analisi di curriculum vitae. Analizza attentamente questo CV e estrai le seguenti informazioni in formato JSON:

CAMPI RICHIESTI:
- firstName: il nome della persona (stringa)
- lastName: il cognome della persona (stringa)
- email: l'indirizzo email (stringa)
- phone: il numero di telefono (stringa)
- position: il profilo/ruolo professionale attuale o desiderato (stringa)
- company: l'azienda attuale o più recente (stringa)
- experience: gli anni di esperienza totale come stringa (es. "5+ anni", "2-3 anni")
- skills: un array di competenze tecniche e professionali chiave (array di stringhe)
- notes: un riassunto professionale dettagliato che includa:
  * Profilo professionale
  * Esperienze lavorative principali con ruoli e responsabilità
  * Formazione
  * Eventuali certificazioni o achievement rilevanti

ISTRUZIONI:
1. Leggi attentamente tutto il contenuto del CV
2. Estrai le informazioni in modo accurato e completo
3. Per le competenze (skills), includi sia hard skills che soft skills rilevanti
4. Per le note, crea un riassunto ben strutturato e informativo
5. Rispondi SOLO con un oggetto JSON valido, senza altre spiegazioni. Assicurati che l'output sia un JSON valido e completo.

Formato JSON di output:
{
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  "phone": "...",
  "position": "...",
  "company": "...",
  "experience": "...",
  "skills": ["...", "..."],
  "notes": "..."
}`
                },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64String
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2000,
            }
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error('Google AI API error during PDF parsing:', errorBody);
          throw new Error(`Errore API Gemini durante l'analisi del PDF. Status: ${response.status}. Dettagli: ${errorBody.substring(0, 200)}...`);
        } else {
          const data = await response.json();
          console.log('Google AI response received');

          const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!extractedText) {
             console.error('Google AI response missing extracted text or candidates.');
             throw new Error('L\'AI non ha restituito dati estratti. Il CV potrebbe essere illeggibile o il prompt non è stato soddisfatto.');
          } else {
            console.log('Extracted text from Google AI:', extractedText);

            // Parse the JSON response from Google AI
            try {
              // 1. Use regex to find the JSON block, handling various markdown fences (non-greedy)
              const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/i);
              let jsonString = jsonMatch ? jsonMatch[1] : extractedText;
              
              // 2. Aggressively strip any remaining markdown fences or surrounding text
              jsonString = jsonString.replace(/```/g, '').trim();
              
              // 3. Attempt to find the first '{' and the last '}' to isolate the JSON object
              const firstBrace = jsonString.indexOf('{');
              const lastBrace = jsonString.lastIndexOf('}');

              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  jsonString = jsonString.substring(firstBrace, lastBrace + 1);
              } else if (firstBrace === -1 || lastBrace === -1) {
                  // If braces are missing, the output is fundamentally broken
                  throw new Error("Output does not contain valid JSON braces.");
              }

              parsedData = JSON.parse(jsonString);
              
              // Final validation: ensure required fields are not empty strings if they were extracted
              if (parsedData && typeof parsedData === 'object') {
                  parsedData.firstName = parsedData.firstName || '';
                  parsedData.lastName = parsedData.lastName || '';
                  parsedData.email = parsedData.email || '';
              }

            } catch (parseError) {
              console.error('Error parsing Google AI response:', parseError);
              console.error('Response text:', extractedText);
              throw new Error(`L'AI ha restituito un formato non JSON valido. Dettagli: ${extractedText.substring(0, 100)}...`);
            }
          }
        }
      } catch (error) {
        console.error('Error with Google AI request (during PDF parsing):', error);
        throw error; // Rilancia l'errore
      }
    }

    console.log('Successfully parsed CV data:', parsedData);

    return new Response(JSON.stringify({
      success: true,
      data: parsedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-cv function:', error);
    
    // Gestione degli errori per il client
    let errorMessage = 'Errore sconosciuto durante l\'analisi del CV.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // Se l'errore contiene i dettagli dell'API, lo passiamo direttamente
    if (errorMessage.includes('Errore API Gemini') || errorMessage.includes('Connessione API Google AI fallita') || errorMessage.includes('L\'AI non ha restituito dati')) {
        // Passa l'errore specifico al client
    } else {
        // Per tutti gli altri errori (es. file non fornito, errore di parsing locale)
        errorMessage = `Errore interno: ${errorMessage}`;
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});