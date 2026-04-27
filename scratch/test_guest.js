const fs = require('fs');

async function test() {
  const form = new FormData();
  // Create a dummy PDF just to hit the endpoint validation, 
  // or use an actual small file if available
  const blob = new Blob(["%PDF-1.4 dummy"], { type: "application/pdf" });
  form.append("pdf", blob, "dummy.pdf");
  
  try {
    const res = await fetch("http://localhost:3000/api/guest/generate", {
      method: "POST",
      body: form
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}
test();
