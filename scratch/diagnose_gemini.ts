import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function diagnose() {
  const key = process.env.GEMINI_API_KEY?.split(",")[0].trim();
  if (!key) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    return;
  }

  console.log("🔍 Starting Gemini Diagnostics...");
  const genAI = new GoogleGenerativeAI(key);

  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp"
  ];

  for (const modelId of modelsToTest) {
    try {
      console.log(`\nTesting Model: ${modelId}...`);
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent("Hello, are you working?");
      console.log(`✅ ${modelId} is WORKING. Response: ${result.response.text().slice(0, 30)}...`);
    } catch (err: any) {
      console.error(`❌ ${modelId} FAILED: ${err.message}`);
    }
  }
  
  console.log("\n--- Recommendation ---");
  console.log("If all 1.5 models failed with 404, your API key might be restricted to a specific region or 'gemini-pro' (legacy).");
}

diagnose();
