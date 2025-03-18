// import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// // import { getCharacterById } from "./chatDB";

// const getAPIKey = () => localStorage.getItem("google_api_key");

// export const generateAIResponse = async (prompt, history = []) => {
//   const apiKey = getAPIKey();
//   if (!apiKey) throw new Error("API key is missing. Please log in.");

//   const selectedModel = localStorage.getItem("ai_model") || "gemini-1.5-pro";
//   const maxTokens = parseInt(localStorage.getItem("max_output_tokens")) || 1000;
//   const temperature = parseFloat(localStorage.getItem("temperature")) || 0.7;
  
//   // Retrieve safety settings or default to BLOCK_NONE
//   const storedSafetySettings = JSON.parse(localStorage.getItem("safety_settings")) || {
//     harassment: "BLOCK_NONE",
//     hate_speech: "BLOCK_NONE",
//     sexual: "BLOCK_NONE",
//     dangerous: "BLOCK_NONE",
//   };

//   // Convert stored safety settings into Gemini's required format
//   const safetySettings = [
//     {
//       category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//       threshold: HarmBlockThreshold[storedSafetySettings.harassment],
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//       threshold: HarmBlockThreshold[storedSafetySettings.hate_speech],
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//       threshold: HarmBlockThreshold[storedSafetySettings.sexual],
//     },
//     {
//       category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//       threshold: HarmBlockThreshold[storedSafetySettings.dangerous],
//     },
//   ];

//   const genAI = new GoogleGenerativeAI(apiKey);
//   const model = genAI.getGenerativeModel({ 
//     model: selectedModel,
//     generationConfig: {
//       maxOutputTokens: maxTokens,
//       temperature: temperature,
//     },
//     safetySettings: safetySettings,
//    });

//   history.pop(); // to remove last duplicate message sinse it will be added by sendMessageStream;

//   if (history.length === 0 || !history[0].parts[0].text) {
//     throw new Error("Invalid chat history: At least one valid user message is required.");
//   }
//   history = history.filter((item) => {
//     return item?.parts[0]?.text;
//   })
//   // Start a chat session
//   const chat = await model.startChat({ history: history });

//   const stream = await chat.sendMessageStream(prompt);
//   let response = "";
//   for await (const chunk of stream.stream) {
//     response += chunk.text();
//   }
//   return response;
// };
