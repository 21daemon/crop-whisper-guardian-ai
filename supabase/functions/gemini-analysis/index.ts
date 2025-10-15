
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
    const { imageBase64, analysisType = 'disease_prediction', prompt } = await req.json()
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }
    
    console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY)
    console.log('API Key length:', GEMINI_API_KEY?.length)

    let promptText = '';
    
    if (analysisType === 'chatbot') {
      promptText = `You are a helpful AI assistant specializing in cotton crops and agricultural diseases. 
      
You can answer questions about:
- Cotton crop diseases and their symptoms
- Treatment recommendations for cotton diseases
- Prevention strategies for cotton farming
- General agricultural advice for cotton cultivation
- Soil health and nutrient management
- Pest control for cotton crops

User question: ${prompt}

Provide a clear, concise, and helpful response. Be professional and accurate in your answers.`;
    } else if (analysisType === 'disease_prediction') {
      promptText = `You are an expert agricultural AI specializing in cotton crop disease detection. Analyze this image carefully and provide:

1. First, determine if this is actually a cotton plant image
2. If it's a cotton plant, identify any diseases present:
   - Cotton Leaf Curl Disease: characterized by leaf curling, yellowing, stunted growth
   - Bacterial Blight: water-soaked spots, angular lesions, defoliation
   - Fusarium Wilt: yellowing of lower leaves, wilting, vascular discoloration
   - Healthy Cotton: no visible symptoms, normal growth

3. Provide your analysis in this format:
   - State clearly if this is a cotton plant or not
   - If it's cotton, identify the specific disease or state if it's healthy
   - Describe the visible symptoms you observe
   - Suggest appropriate treatment if disease is present
   - Provide preventive measures

Be specific and confident in your diagnosis. Focus on observable plant characteristics and disease symptoms.`;
    } else {
      // Fallback for additional insights
      promptText = `You are an expert agricultural consultant specializing in cotton crop diseases. Based on the provided disease information, please provide:

1. Additional insights about this specific disease
2. Preventive farming practices to avoid this disease
3. Best practices for cotton cultivation in affected areas
4. Long-term management strategies
5. Environmental factors that contribute to this disease

Keep your response concise but informative, around 200-300 words.`;
    }

    // Prepare the request payload for Gemini
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText
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
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    }

    console.log('Sending request to Gemini API for disease prediction...')
    console.log('Using model: gemini-1.5-flash')
    
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
      console.error('Gemini API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        apiKeyPresent: !!GEMINI_API_KEY
      })
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
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
