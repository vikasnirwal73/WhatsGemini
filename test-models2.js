const fs = require('fs');
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + fs.readFileSync('.env').toString().match(/REACT_APP_GEMINI_API_KEY=(.*)/)[1])
  .then(r => r.json())
  .then(d => {
    d.models.forEach(m => {
       console.log(m.name, m.supportedGenerationMethods);
    });
  })
