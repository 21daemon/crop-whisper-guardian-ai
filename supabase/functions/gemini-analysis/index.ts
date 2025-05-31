
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { diseaseData, imageBase64 } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    // Prepare the request payload for Gemini
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert agricultural consultant specializing in cotton crop diseases. I have detected the following disease in a cotton plant:

Disease: ${diseaseData.disease.name}
Symptoms: ${diseaseData.disease.symptoms}
Recommended Treatment: ${diseaseData.disease.treatment}
Confidence: ${diseaseData.confidenceScores[0].confidence}%

Please provide:
1. Additional insights about this specific disease
2. Preventive farming practices to avoid this disease
3. Best practices for cotton cultivation in affected areas
4. Long-term management strategies
5. Environmental factors that contribute to this disease

Keep your response concise but informative, around 200-300 words.`
            },
            ...(imageBase64 ? [{
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix
              }
            }] : [])
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    }

    console.log('Sending request to Gemini API...')
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Gemini API response received')

    // Extract the generated text from Gemini's response
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                    'Unable to generate analysis at this time.'

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in gemini-analysis function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze with Gemini', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
