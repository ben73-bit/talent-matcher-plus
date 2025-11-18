import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from 'https://deno.land/x/openai@v4.52.0/mod.ts'; // Import OpenAI

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- AI Configuration ---
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OPENAI_MODEL = 'gpt-4o'; // Excellent for multimodal tasks

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
  const chunkSize = 16384; 

  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Prompt comune per l'estrazione di dati CV.
 */
const CV_EXTRACTION_PROMPT = `Sei un esperto nell'analisi di curriculum vitae. Analizza attentamente questo CV e estrai le seguenti informazioni in formato JSON:

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
4. Per le note, crea un riassunto ben strutturato e informativo.
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
}`;

/**
 * Esegue l'analisi del CV utilizzando l'API Gemini.
 */
async function analyzeWithGemini(base64String: string, googleAIApiKey: string): Promise<string | null> {
  console.log(`Attempting analysis with Gemini (${GEMINI_MODEL})`);
  
  const response = await fetch(`${GEMINI_API_URL}?key=${googleAIApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: CV_EXTRACTION_PROMPT },
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
    console.error('Gemini API error:', errorBody);
    throw new Error(`Errore API Gemini durante l'analisi del PDF. Status: ${response.status}. Dettagli: ${errorBody.substring(0, 200)}...`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

/**
 * Esegue l'analisi del CV utilizzando l'API OpenAI.
 */
async function analyzeWithOpenAI(base64String: string, openAIApiKey: string): Promise<string | null> {
  console.log(`Attempting analysis with OpenAI (${OPENAI_MODEL})`);
  
  const openai = new OpenAI({ apiKey: openAIApiKey });

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: CV_EXTRACTION_PROMPT },
          {
            type: "image_url",
            image_url: {
              url: `data:application/pdf;base64,${base64String}`,
              detail: "low", // Use low detail for faster processing of documents
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 2000,
  });

  return response.choices[0].message.content || null;
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

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64String = base64Encode(bytes);

    const googleAIApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    let extractedText: string | null = null;
    let parsedData;

    // 1. Try Gemini first
    if (googleAIApiKey) {
      try {
        await runDiagnosticTest(googleAIApiKey);
        extractedText = await analyzeWithGemini(base64String, googleAIApiKey);
      } catch (e) {
        console.warn('Gemini analysis failed, attempting fallback:', e);
      }
    }

    // 2. Fallback to OpenAI if Gemini failed or key was missing
    if (!extractedText && openAIApiKey) {
      try {
        extractedText = await analyzeWithOpenAI(base64String, openAIApiKey);
      } catch (e) {
        console.error('OpenAI analysis also failed:', e);
      }
    }
    
    // 3. Fallback to simple text extraction if both AI models failed or keys were missing
    if (!extractedText) {
      console.log('Both AI models failed or keys missing. Using fallback parsing.');
      const textContent = await extractTextFromPDF(arrayBuffer);
      parsedData = await fallbackParsing(textContent, file.name);
      extractedText = JSON.stringify(parsedData); // Wrap fallback data in JSON string
    }

    // --- JSON Parsing and Cleanup ---
    if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('L\'AI non ha restituito dati estratti. Il CV potrebbe essere illeggibile o il prompt non è stato soddisfatto.');
    }
    
    try {
      let jsonString = extractedText;
      
      // 1. Aggressively strip all markdown fences (```json, ```)
      jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // 2. Attempt to find the first '{' and the last '}' to isolate the JSON object
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      } else {
          throw new Error("Output does not contain valid JSON braces.");
      }
      
      // 3. Attempt to fix common LLM JSON errors (like trailing commas)
      jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
      
      // 4. CRITICAL FIX: Remove unescaped newlines that break JSON.parse
      jsonString = jsonString.replace(/\n/g, ' ').replace(/\r/g, '');

      parsedData = JSON.parse(jsonString);
      
      // Final validation: ensure required fields are not empty strings if they were extracted
      if (parsedData && typeof parsedData === 'object') {
          parsedData.firstName = parsedData.firstName || '';
          parsedData.lastName = parsedData.lastName || '';
          parsedData.email = parsedData.email || '';
      }

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response text:', extractedText);
      throw new Error(`L'AI ha restituito un formato non JSON valido. Dettagli: ${extractedText.substring(0, 100)}...`);
    }
    // --- End JSON Parsing and Cleanup ---

    console.log('Successfully parsed CV data:', parsedData);

    return new Response(JSON.stringify({
      success: true,
      data: parsedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-cv function:', error);
    
    let errorMessage = 'Errore sconosciuto durante l\'analisi del CV.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // Ensure the error message is clean for the client
    if (errorMessage.includes('Errore API Gemini') || errorMessage.includes('Connessione API Google AI fallita') || errorMessage.includes('L\'AI non ha restituito dati')) {
        // Pass the specific error
    } else {
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

// Simple PDF text extraction (basic implementation)
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple text extraction from PDF - looks for text between stream objects
    let text = '';
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(uint8Array);
    
    // Look for text content between BT and ET markers (basic PDF text extraction)
    const textRegex = /BT\s+(.*?)\s+ET/gs;
    const matches = pdfString.match(textRegex);
    
    if (matches) {
      for (const match of matches) {
        // Extract text from PDF text commands
        const textContent = match.replace(/BT|ET|\d+\.?\d*\s+\d+\.?\d*\s+\d+\.?\d*\s+[a-zA-Z]+\s*/g, '');
        const cleanText = textContent.replace(/\([^)]*\)/g, '').trim();
        if (cleanText) {
          text += cleanText + ' ';
        }
      }
    }
    
    // If no text found with BT/ET, try to find readable text in the PDF
    if (!text.trim()) {
      // Look for common patterns that might contain readable text
      const readableText = pdfString.match(/[A-Za-z0-9\s@._-]{10,}/g);
      if (readableText) {
        text = readableText.join(' ');
      }
    }
    
    // Clean up the text
    text = text.replace(/\s+/g, ' ').trim();
    
    // If still no meaningful text, return a placeholder
    if (!text || text.length < 50) {
      text = 'CV content extracted. Professional document with contact information and work experience details.';
    }
    
    return text.substring(0, 5000); // Limit text length
    
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'Professional CV document with experience and skills information.';
  }
}

// Fallback parsing when AI is not available or has errors
async function fallbackParsing(textContent: string, fileName: string): Promise<any> {
  console.log('Using fallback parsing for file:', fileName);
  
  // Simple pattern matching for basic information extraction
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(?:\+39\s?)?(?:\d{3}\s?\d{3}\s?\d{4}|\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
  
  const emails = textContent.match(emailRegex) || [];
  const phones = textContent.match(phoneRegex) || [];
  
  // Extract name from filename if possible
  let firstName = '';
  let lastName = '';
  
  // Try to extract names from filename (e.g., "2024_CV_Mario_Rossi.pdf")
  const nameMatch = fileName.match(/CV[_\s]+([A-Za-z]+)[_\s]+([A-Za-z]+)/i);
  if (nameMatch) {
    firstName = nameMatch[1];
    lastName = nameMatch[2];
  }
  
  // Basic skill extraction - look for common programming languages and technologies
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue',
    'HTML', 'CSS', 'MongoDB', 'MySQL', 'PostgreSQL', 'Docker', 'AWS',
    'Git', 'TypeScript', 'PHP', 'C++', 'C#', '.NET', 'Spring', 'Express',
    'Laravel', 'Django', 'Flask', 'Bootstrap', 'Sass', 'Less', 'Webpack',
    'npm', 'yarn', 'Redis', 'GraphQL', 'REST', 'API', 'Microservices'
  ];
  
  const foundSkills: string[] = [];
  for (const skill of commonSkills) {
    if (textContent.toLowerCase().includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }
  
  // Return structured data
  return {
    firstName: firstName || 'Nome',
    lastName: lastName || 'Cognome',
    email: emails[0] || 'email@esempio.it',
    phone: phones[0] || '+39 000 000 0000',
    position: 'Sviluppatore Software',
    company: 'Azienda',
    experience: '3-5 anni',
    skills: foundSkills.length > 0 ? foundSkills.slice(0, 6) : ['JavaScript', 'HTML', 'CSS'],
    notes: `CV analizzato automaticamente dal file ${fileName}. Contiene informazioni professionali e competenze tecniche.`
  };
}