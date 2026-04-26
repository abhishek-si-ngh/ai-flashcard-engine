import { GoogleGenerativeAI } from "@google/generative-ai";

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

// Key rotation helper
async function executeWithKeyRotation<T>(action: (model: any) => Promise<T>): Promise<T> {
  const keysStr = process.env.GEMINI_API_KEY || "";
  const apiKeys = keysStr.split(",").map(k => k.trim()).filter(k => k);

  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys provided.");
  }

  let lastError: unknown;

  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`[Gemini] Using API Key ${i + 1}/${apiKeys.length}`);
      const genAI = new GoogleGenerativeAI(apiKeys[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      return await withRetry(() => action(model));
    } catch (error: unknown) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Gemini] Key ${i + 1} failed: ${message}`);
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

  const result = await executeWithKeyRotation<any>(model => model.generateContent(prompt));
  const response = result.response.text();

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON in AI response");

  return JSON.parse(jsonMatch[0]) as GeneratedDeck;
}

// PDF → Flashcards (FIXED VERSION)
export async function generateFlashcardsFromPDF(pdfBuffer: Buffer): Promise<GeneratedDeck & { rawText: string }> {
  const base64Data = pdfBuffer.toString("base64");

  const result = await executeWithKeyRotation<any>(model =>
    model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
      {
        text: `${SYSTEM_PROMPT}

IMPORTANT:
- Extract full meaning from PDF
- Do NOT summarize only
- Generate diverse, deep-thinking flashcards
- Include at least 20 flashcards

ALSO: After the JSON, provide a section "---RAW_TEXT---" containing the full extracted text from the PDF so I can store it for later chat.
`,
      },
    ])
  );

  const response = result.response.text();
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No valid JSON in AI response");

  const deck = JSON.parse(jsonMatch[0]) as GeneratedDeck;
  
  const rawTextMatch = response.split("---RAW_TEXT---")[1];
  const rawText = rawTextMatch ? rawTextMatch.trim() : "Text extraction failed.";

  return { ...deck, rawText };
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
export async function generateAIQuiz(context: string, count: number = 10): Promise<any[]> {
  const prompt = `You are an expert examiner designing a HIGH-QUALITY MCQ quiz.

Create a ${count}-question quiz based on the content.

Content:
${context.slice(0, 40000)}

Requirements:
1. Generate EXACTLY ${count} questions
2. Each question must have EXACTLY 4 options
3. One correct answer MUST match exactly one option

QUALITY RULES:
- Questions must test understanding, not memorization
- Avoid copying text directly
- Include a mix of:
  • Easy (30%)
  • Medium (50%)
  • Hard / edge-case (20%)

- Include:
  • Conceptual questions
  • Application-based questions
  • Tricky / misconception-based questions

OPTIONS RULES:
- All 4 options must be plausible
- Avoid obviously wrong answers
- Keep options similar in length and style

ANSWER RULES:
- Keep answers concise (max 10–12 words)

EXPLANATION (IMPORTANT):
- Add a VERY short explanation (EXACTLY 1 sentence) for each answer

Return ONLY valid JSON:

[
  {
    "question": "analytical question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "exact correct option",
    "explanation": "why this is correct",
    "difficulty": "easy | medium | hard",
    "topic": "main concept tested"
  }
]
`;

  const result = await executeWithKeyRotation<any>(model => 
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    })
  );
  
  const response = result.response.text();
  console.log("[Gemini] Quiz Raw Response:", response);
  
  try {
    const data = JSON.parse(response);
    return Array.isArray(data) ? data : data.quiz || [];
  } catch (e) {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No valid JSON array in AI response");
    return JSON.parse(jsonMatch[0]);
  }
}

