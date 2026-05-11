const fs = require('fs');
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + fs.readFileSync('.env').toString().match(/REACT_APP_GEMINI_API_KEY=(.*)/)[1])
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent') || m.supportedGenerationMethods.includes('generateImages')), null, 2)))
