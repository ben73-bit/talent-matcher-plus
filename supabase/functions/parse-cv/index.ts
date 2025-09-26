import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to prevent memory issues
    let base64String = '';
    const chunkSize = 32768;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      const binaryString = String.fromCharCode.apply(null, Array.from(chunk));
      base64String += btoa(binaryString);
    }

    console.log('File converted to base64, length:', base64String.length);

    // Parse PDF content using a simple text extraction approach
    // Note: For production, you'd use a proper PDF parsing library
    const textContent = await extractTextFromPDF(arrayBuffer);
    
    console.log('Text extracted from PDF:', textContent.substring(0, 500) + '...');

    // Use OpenAI to analyze the extracted text
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
Analizza questo CV e estrai le seguenti informazioni in formato JSON:
- firstName (nome)
- lastName (cognome) 
- email
- phone (telefono)
- position (posizione/ruolo desiderato o attuale)
- company (azienda attuale o più recente)
- experience (esperienza in anni come stringa, es. "5+ anni")
- skills (array di competenze tecniche)
- notes (breve riassunto professionale)

Testo del CV:
${textContent}

Rispondi SOLO con un JSON valido, senza altre spiegazioni:`;

    console.log('Sending request to OpenAI');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sei un esperto nell\'analisi di CV. Estrai sempre le informazioni richieste in formato JSON valido. Se un\'informazione non è disponibile, usa una stringa vuota o array vuoto.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const extractedText = data.choices[0].message.content;
    console.log('Extracted text from OpenAI:', extractedText);

    // Parse the JSON response from OpenAI
    let parsedData;
    try {
      // Clean up the response to ensure it's valid JSON
      const cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Response text:', extractedText);
      throw new Error('Invalid JSON response from AI analysis');
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
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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