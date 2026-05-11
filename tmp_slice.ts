  async ({ prompt, history = [], systemInstruction, characterImages, isImageRequest = false }: { prompt: string; history?: any[], systemInstruction?: string, characterImages?: string[], isImageRequest?: boolean }, { rejectWithValue, signal }) => {
    try {
      const apiKey = getAPIKey();
      if (!apiKey) throw new Error("API key is missing. Please log in.");
      const maxHistoryLength = parseInt(localStorage.getItem(LS_MAX_CHAT_LENGTH) || "0", 10);
      let selectedModel = getStoredValue(LS_AI_MODEL, DEFAULT_AI_MODEL);
      
      if (isImageRequest) {
        selectedModel = getStoredValue(LS_IMAGE_MODEL, DEFAULT_IMAGE_MODEL); 
      }
      
      // Inject conversation context into the image generation prompt so the model understands references like "give him a hat"
      let finalPrompt = prompt;
      if (isImageRequest) {
        let recentContext = "";
        const baseImagePrompt = getStoredValue(LS_IMAGE_GEN_PROMPT, DEFAULT_IMAGE_GEN_PROMPT);

        if (history && history.length > 0) {
          const recentMsgs = history.slice(-6).filter((m: any) => m?.parts?.[0]?.text);
          if (recentMsgs.length > 0) {
            recentContext = "Recent chat context:\n" + recentMsgs.map((m: any) => `${m.role === "user" ? "User" : "AI"}: ${m.parts[0].text}`).join("\n") + "\n\n";
          }
        }

        const instructionSuffix = `\n\nBase Instruction:\n${baseImagePrompt}\n\nIMPORTANT: Along with the image, you MUST also output a very brief text description (in brackets like [Generated Image: ...]) describing the key details of the visual (characters, clothes, pose, environment). This will be saved in our chat history so we remember what was drawn!`;

        if (!/\b(generate image|draw|picture|pic|photo|image)\b/i.test(prompt)) {
          finalPrompt = `${recentContext}Current user request: "${prompt}"\n\nPlease generate an image that fulfills the current request, using the recent chat context for visual references.${instructionSuffix}`;
        } else {
          finalPrompt = `${recentContext}User image request: "${prompt}"\n\nPlease generate the requested image, using the recent chat context for any missing visual details.${instructionSuffix}`;
        }
      }
      
      const maxTokens = getStoredValue(LS_MAX_OUTPUT_TOKENS, DEFAULT_OUTPUT_TOKENS, Number);
      const temperature = getStoredValue(LS_TEMPRATURE, DEFAULT_TEMPRATURE, parseFloat);
      const storedSafetySettings = getStoredValue<AISafetySettings | any>(
        LS_SAFETY_SETTINGS,
        DEFAULT_SAFETY_SETTINGS,
        JSON.parse
      );

      const safetySettings = formatSafetySettings(storedSafetySettings);
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelParams: any = {
        model: selectedModel,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
        safetySettings: safetySettings,
      };

      if (systemInstruction) {
        modelParams.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelParams);

      // Filter out empty messages
      const validHistory = history.filter(
        (msg) => msg?.parts?.[0]?.text && msg.role
      );

      // If the last message in history is the same as the prompt, remove it to avoid duplication
      // (This happens because it was just saved in Redux before this thunk was called)
      if (
        validHistory.length > 0 &&
        validHistory[validHistory.length - 1].role === "user" &&
        validHistory[validHistory.length - 1].parts[0].text === prompt
      ) {
        validHistory.pop();
      }
      
      if (maxHistoryLength > 0) {
        const initialMessages = getInitialMessages();
        const initialMessagesLength = initialMessages.length || 0;
        const maxLength = validHistory.length - maxHistoryLength;
        if (maxLength > 0) {
           const startIndex = initialMessagesLength > 0 ? initialMessagesLength : 1;
           if (startIndex < validHistory.length) {
              validHistory.splice(startIndex, maxLength);
           }
        }
      }

      // Ensure the history passed to startChat does not end with a "user" string 
      // otherwise sendMessageStream(prompt) will result in consecutive user turns. 
      // (If it does, pop the trailing un-anwered user message).
      while (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
        validHistory.pop();
      }

      const historyForSdk = validHistory;

      // Defensively start chat session and get response
      const chat = await model.startChat({ history: historyForSdk });
