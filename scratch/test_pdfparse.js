const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function testPDFParse() {
  try {
    // Download a simple test PDF
    const https = require('https');
    const testUrl = 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/dummy.pdf';
    
    // Instead, just test the API with a synthetic buffer that we know is valid
    // We'll check if load() works at all
    const parser = new PDFParse({});
    console.log('Parser created OK');
    
    // Let's check what load() expects
    const loadFn = parser.load.toString().slice(0, 200);
    console.log('load() signature:', loadFn);
    
    // Check getText
    const getTextFn = parser.getText.toString().slice(0, 200);
    console.log('getText() signature:', getTextFn);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testPDFParse();
