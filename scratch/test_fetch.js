const dotenv = require('dotenv');
dotenv.config();

async function test() {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const key = rawKey.split(',')[0].trim().replace(/^["']|["']$/g, "");
  
  console.log("Using Key (first 5):", key.slice(0, 5));
  
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "hi" }] }]
      })
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

test();
