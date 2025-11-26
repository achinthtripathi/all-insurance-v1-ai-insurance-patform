import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentUrl, documentId } = await req.json();
    console.log('Parsing certificate:', { documentUrl, documentId });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Lovable AI to parse the certificate
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting data from insurance certificates and covernotes. 
Extract the following information and return it as JSON:
- named_insured: string
- certificate_holder: string
- additional_insured: string
- cancellation_notice_period: string
- form_type: string
- coverages: array of objects with structure:
  {
    type: string (e.g., "Commercial General Liability", "Automobile Liability", "Non-Owned Trailer Liability"),
    insurance_company: string,
    policy_number: string,
    coverage_limit: string,
    coverage_currency: string,
    deductible_limit: string,
    deductible_currency: string,
    effective_date: string (ISO format),
    expiry_date: string (ISO format)
  }

Return ONLY valid JSON, no additional text.`
          },
          {
            role: 'user',
            content: `Parse this insurance certificate: ${documentUrl}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits required. Please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to parse certificate with AI');
    }

    const aiData = await response.json();
    const extractedText = aiData.choices[0].message.content;
    
    console.log('AI extraction result:', extractedText);

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-certificate function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});