const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const key = rawKey.split(',')[0].trim().replace(/^["']|["']$/g, "");
  console.log("Using Key (first 5):", key.slice(0, 5));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = await res.json();
    if (data.models) {
      console.log("\n✅ Available models that support generateContent:");
      data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
        .forEach(m => console.log(" -", m.name, "|", m.displayName));
    } else {
      console.log("Response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listModels();
