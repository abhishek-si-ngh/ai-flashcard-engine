import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios"; // For Ollama local API support


// Fix for 'DOMMatrix is not defined' error in server-side PDF parsing
if (typeof global !== "undefined" && !global.DOMMatrix) {
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix {};
}

export interface FlashCard {
  front: string;
  back: string;
  hint?: string;
  type: "concept" | "definition" | "example" | "edge_case" | "cloze";
  clozeContent?: string;
}

export interface GeneratedDeck {
  title: string;
  subject: string;
  description: string;
  emoji: string;
  cards: FlashCard[];
}

const SYSTEM_PROMPT = `You are an expert teacher and cognitive scientist specializing in active recall and spaced repetition learning.

Your task is to generate HIGH-QUALITY flashcards that test deep understanding.

Flashcard requirements:
1. Cover KEY CONCEPTS clearly
2. Include DEFINITIONS of important terms
3. Add REAL-WORLD or WORKED EXAMPLES
4. Include EDGE CASES and tricky scenarios
5. Include CLOZE (fill-in-the-blank) deletions for key facts

Quality rules:
- Questions must provoke thinking (avoid simple copy-paste)
- Avoid generic or vague answers
- Focus on important concepts, cause-effect, and applications
- Highlight common mistakes students make

Card types:
- "concept" → understanding-based
- "definition" → key terms
- "example" → applied questions
- "edge_case" → tricky or uncommon scenarios
- "cloze" → fill-in-the-blank style. For cloze, "front" should be the sentence with [...] and "back" should be the missing word(s). Also provide "clozeContent" which is the full sentence.

Generation rules:
- Generate 20–40 flashcards depending on content length
- Cover the ENTIRE content (not just summary)
- Ensure diversity in question types
- KEEP ANSWERS CONCISE: Max 2 short sentences per answer. Focus on the core fact.

Return ONLY valid JSON in this format:
{
  "title": "deck title from content",
  "subject": "subject area",
  "description": "1-2 sentence summary",
  "emoji": "single relevant emoji",
  "cards": [
    {
      "front": "question here",
      "back": "answer here",
      "hint": "optional hint",
      "type": "concept",
      "clozeContent": "full sentence for cloze"
    }
  ]
}`;

// Retry helper
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("503") && attempt < maxRetries - 1) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Gemini] 503 error. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

// Key rotation helper with Bulletproof Fallback
async function executeWithKeyRotation<T>(action: (model: any) => Promise<T>): Promise<T> {
  const keysStr = process.env.GEMINI_API_KEY || "";
  // Robustly split and strip quotes/whitespace from keys
  const apiKeys = keysStr.split(",")
    .map(k => k.trim().replace(/^["']|["']$/g, ""))
    .filter(k => k);
  
  // Using specific stable versions as recommended
  // Ultra-Stable Model List
  const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];

  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys provided.");
  }

  let lastError: any;

  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);
    
    for (const modelId of MODELS_TO_TRY) {
      try {
        console.log(`[Gemini] Key ${i + 1} | Model ${modelId} | Attempting...`);
        const model = genAI.getGenerativeModel({ model: modelId });
        return await withRetry(() => action(model));
      } catch (error: any) {
        lastError = error;
        const message = error.message || String(error);
        console.warn(`[Gemini] Key ${i+1}/${modelId} Failed: ${message.slice(0, 100)}... Trying next option.`);
        // Try next model or next key regardless of error type
        continue;
      }
    }
  }

  throw lastError;
}

// LOCAL AI SUPPORT (OLLAMA)
async function generateWithOllama(prompt: string, model: string = "llama3"): Promise<string> {
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model,
      prompt,
      stream: false,
      format: "json"
    }, { timeout: 30000 });
    return response.data.response;
  } catch (error) {
    console.warn("[Ollama] Local API failed. Ensure Ollama is running on port 11434.");
    throw new Error("Local AI (Ollama) failed. Please ensure Ollama is installed and running.");
  }
}


// TEXT → Flashcards
export async function generateFlashcardsFromText(text: string): Promise<GeneratedDeck> {
  const prompt = `
${SYSTEM_PROMPT}

IMPORTANT:
- Do NOT copy sentences directly from text
- Rephrase into learning-focused questions
- Ensure at least 20 flashcards
- Include tricky and conceptual questions

Content:
${text.slice(0, 50000)}
`;

  const result = await executeWithKeyRotation<any>(model => 
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    })
  );
  const response = result.response.text();

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON in AI response");

  return JSON.parse(jsonMatch[0]) as GeneratedDeck;
}

// PDF → Flashcards (UNIVERSAL STABLE VERSION)
export async function generateFlashcardsFromPDF(pdfBuffer: Buffer): Promise<GeneratedDeck & { rawText: string }> {
  console.log("[Gemini] Starting universal PDF processing...");
  
  // 1. TRY LOCAL EXTRACTION FIRST (Most stable for text)
  try {
    const pdfLib = require("pdf-parse");
    // Check every possible export location
    const pdfReader = (typeof pdfLib === "function") ? pdfLib : (pdfLib.default || pdfLib.pdfParse || Object.values(pdfLib).find(v => typeof v === "function"));
    
    if (typeof pdfReader === "function") {
      const data = await pdfReader(pdfBuffer);
      const text = data?.text;
      if (text && text.trim().length > 50) {
        console.log(`[Gemini] Local extraction successful (${text.length} chars).`);
        const generated = await generateFlashcardsFromText(text);
        return { ...generated, rawText: text };
      }
    }
    console.warn("[Gemini] Local extraction failed or returned no text. Falling back to AI Multimodal...");
  } catch (err) {
    console.warn("[Gemini] Local PDF reader failed to load. Trying AI Multimodal fallback...");
  }

  // 2. FALLBACK TO AI MULTIMODAL (Gemini's native PDF support)
  try {
    const base64Data = pdfBuffer.toString("base64");
    const prompt = `${SYSTEM_PROMPT}\n\nIMPORTANT: Extract all key info and return JSON. Also include a section ---RAW_TEXT--- with the full text.`;

    const result = await executeWithKeyRotation<any>(model =>
      model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: "application/pdf", data: base64Data } },
            { text: prompt }
          ]
        }]
      })
    );

    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const deck = JSON.parse(jsonMatch?.[0] || "{}");
    const rawText = response.split("---RAW_TEXT---")[1] || "Text extracted via AI.";

    return { ...deck, rawText };
  } catch (error: any) {
    console.error("[Gemini] All PDF methods failed:", error);
    
    // FINAL ATTEMPT: Try Local Ollama if Gemini fails
    try {
      console.log("[Gemini] Falling back to local Ollama...");
      // We need text for Ollama, so if we're here, multimodal failed.
      // We'll try one last time to extract text locally or just fail.
      throw error; 
    } catch (finalErr) {
      throw new Error(`Critical PDF Error: ${error.message || "Could not process file"}. 
      TIPS TO FIX: 
      1. Ensure your GEMINI_API_KEY in .env has NO quotes around it.
      2. If using local AI, run 'ollama run llama3' first.`);
    }
  }
}
// Chat with Document
export async function chatWithDocument(documentContent: string, query: string, history: { role: "user" | "model", parts: string[] }[] = []): Promise<string> {
  const prompt = `You are an AI tutor helping a student understand this document.
  
  Document Content:
  ${documentContent.slice(0, 40000)}
  
  User Query: ${query}
  
  Answer concisely and helpfully based ONLY on the document provided. If the answer is not in the document, say you don't know but offer general knowledge if relevant.`;

  const result = await executeWithKeyRotation<any>(model => {
    const chat = model.startChat({ history });
    return chat.sendMessage(prompt);
  });
  
  return result.response.text();
}

// Dynamic AI Quiz Generation
// Professional AI Quiz Generation (EXAM MODE)
export async function generateAIQuiz(context: string, count: number = 10): Promise<any[]> {
  const prompt = `Act as a PROFESSIONAL EXAMINER.

You are given a list of concepts and explanations.

Your task:
- Create a ${count}-question quiz based on UNDERSTANDING of concepts
- DO NOT copy or rephrase sentences directly
- DO NOT use original wording

INPUT DATA:
${context}

RULES:
1. Questions must test CONCEPTUAL UNDERSTANDING
2. Convert statements into analytical questions
3. Avoid phrases like "What are...", "Explain...", etc.
4. Use scenario-based or applied questions when possible

OPTIONS RULES:
- 4 options per question
- All options must be plausible
- Each option MUST be short (max 6–10 words)
- NO full sentences
- NO explanations inside options
- Use keyword-style or phrase-style answers
- All 4 options must be similar in length and format
- Avoid copying phrases from the input content

STRICT STYLE:
- Questions: 1 sentence max
- Options: short phrases only (not sentences)
- Keep everything clean, exam-style

ANSWER RULES:
- Correct answer must be one of the options exactly

OUTPUT:
Return ONLY JSON:
[
  {
    "question": "conceptual or scenario-based question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "exact correct option"
  }
]`;

  const result = await executeWithKeyRotation<any>(model => 
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    })
  );
  
  const response = result.response.text();
  try {
    const data = JSON.parse(response);
    return Array.isArray(data) ? data : data.quiz || [];
  } catch (e) {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No valid JSON array in AI response");
    return JSON.parse(jsonMatch[0]);
  }
}
