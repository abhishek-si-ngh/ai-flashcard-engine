import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const apiKeys = keysStr.split(",").map(k => k.trim()).filter(k => k);
  
  // Using specific stable versions as recommended
  const MODELS_TO_TRY = ["gemini-1.5-flash-latest", "gemini-1.5-flash-001"];

  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys provided.");
  }

  let lastError: any;

  for (let i = 0; i < apiKeys.length; i++) {
    const genAI = new GoogleGenerativeAI(apiKeys[i]);
    
    for (const modelId of MODELS_TO_TRY) {
      try {
        console.log(`[Gemini] Trying Key ${i + 1} with Model ${modelId}`);
        
        // Removed 'models/' prefix and used stable v1
        const model = genAI.getGenerativeModel(
          { model: modelId },
          { apiVersion: "v1" }
        );
        
        return await withRetry(() => action(model));
      } catch (error: any) {
        lastError = error;
        const message = error.message || String(error);
        
        if (message.includes("404") || message.includes("not found")) {
          console.warn(`[Gemini] Variant ${modelId} not found on v1. Trying next...`);
          continue;
        }
        
        console.error(`[Gemini] Key ${i + 1} failed: ${message}`);
        break; 
      }
    }
  }

  throw lastError;
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

// PDF → Flashcards (ROCK SOLID LOCAL EXTRACTION)
export async function generateFlashcardsFromPDF(pdfBuffer: Buffer): Promise<GeneratedDeck & { rawText: string }> {
  console.log("[Gemini] Starting local PDF extraction...");
  
  try {
    // Robust require with proper function targeting
    const pdfReader = require("pdf-parse");
    const data = await pdfReader(pdfBuffer);
    const text = data?.text;

    if (!text || text.trim().length < 20) {
      throw new Error("The PDF appears to be empty or contains only images (scanned document).");
    }

    console.log(`[Gemini] Extracted ${text.length} characters successfully.`);
    
    const generated = await generateFlashcardsFromText(text);
    
    return {
      ...generated,
      rawText: text
    };
  } catch (error: any) {
    console.error("[PDF Extraction Error]:", error);
    // Provide the actual error message to the user for better debugging
    throw new Error(`PDF Error: ${error.message || "Failed to parse file structure"}`);
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
