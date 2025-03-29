
// Follow this pattern to use Supabase client in your Edge Functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Get message content from the request
    const { messages, problemType, level, problemMode } = await req.json();

    // If no messages were provided, throw an error
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid request: messages array is required");
    }

    // Get API key from Supabase secrets
    const apiKey = Deno.env.get("AI_API_KEY");
    if (!apiKey) {
      throw new Error("AI API key not configured");
    }

    // Create a system message based on the current problem context
    let systemMessage = getSystemPrompt(problemType, level, problemMode);
    
    // Prepare final messages array with system prompt
    const finalMessages = messages.some(m => m.role === 'system') 
      ? messages 
      : [{ role: 'system', content: systemMessage }, ...messages];

    // Call the OpenRouter API (compatible with OpenAI API)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": Deno.env.get("SITE_URL") || "http://localhost:5173",
        "X-Title": "Industry Coding Tutor"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o", // Default to GPT-4o, but can be changed
        messages: finalMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    // Get the AI response
    const aiResponse = await response.json();

    // Save interaction to analytics table if available
    try {
      await supabaseClient.from('chat_interactions').insert({
        problem_type: problemType || null,
        level: level || null,
        problem_mode: problemMode || null,
        message_count: messages.length,
        timestamp: new Date().toISOString(),
      });
    } catch (analyticsError) {
      // Silently fail if analytics table doesn't exist
      console.error("Analytics error:", analyticsError);
    }

    return new Response(
      JSON.stringify(aiResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// Helper function to generate appropriate system prompts based on context
function getSystemPrompt(problemType: string | null, level: string | null, problemMode: string | null): string {
  let basePrompt = `You are an expert coding tutor specializing in the Industry Coding Skills Evaluation Framework. 
This framework assesses coding skills at 4 progressive levels:

Level 1 - Initial Design & Basic Functions:
- Basic implementation, simple methods
- Focus on conditions, loops, type conversions
- Expected time: 10-15 minutes, 15-20 lines of code

Level 2 - Data Structures & Data Processing:
- Implement data processing functions
- Focus on calculations, aggregations, sorting
- Expected time: 20-30 minutes, 40-45 lines of code

Level 3 - Refactoring & Encapsulation:
- Extend and maintain existing codebase
- Focus on refactoring and encapsulation techniques
- Expected time: 30-60 minutes, 90-130 lines of code

Level 4 - Extending Design & Functionality:
- Enhance functionality with backward compatibility
- Focus on efficient code design and performance
- Expected time: 60+ minutes, 110-160 lines of code`;

  // If we have a specific problem type
  if (problemType) {
    basePrompt += `\n\nYou are currently helping with the following data structure or principle: ${problemType}.`;
  }

  // If we have a specific level
  if (level) {
    basePrompt += `\n\nThe current skill level focus is: Level ${level}.`;
  }

  // If we have a specific problem mode (guided vs unguided)
  if (problemMode === 'guided') {
    basePrompt += `\n\nThis is a GUIDED problem. Provide step-by-step instructions, one at a time. Wait for the user to implement each step before providing the next one. Offer hints rather than complete solutions.`;
  } else if (problemMode === 'unguided') {
    basePrompt += `\n\nThis is an UNGUIDED problem. Only provide help when explicitly asked. Let the user work through the problem on their own, but be ready to answer specific questions and provide guidance when requested.`;
  }

  basePrompt += `\n\nAlways make your explanations clear, concise, and educational. Focus on teaching underlying principles rather than just providing solutions.`;

  return basePrompt;
}
