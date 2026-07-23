import { dbService } from "../../../services/dbService";

// Strips base64 image data that leaked into message text instead of being
// extracted into the images array - covers legacy DB rows saved before
// extractAndSaveBase64ImagesLocally existed, and acts as a safety net for
// any future extraction miss before the leak reaches the model as context.
export const stripLeakedBase64 = (text: string): string => {
  const hasLeakedBase64 = text.length > 500 && (text.includes("data:image") || /[A-Za-z0-9+/=]{1000,}/.test(text));
  if (!hasLeakedBase64) return text;

  return text
    .replace(/!\[.*?\]\(\s*(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+)\s*\)/g, '')
    .replace(/<img[^>]+src=["'](data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+)["'][^>]*>/gi, '')
    .replace(/data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+/g, '')
    .replace(/[A-Za-z0-9+/=]{1000,}/g, '');
};

export const extractAndSaveBase64ImagesLocally = async (
  responseText: string,
  generatedImages: string[]
): Promise<string> => {
  let finalResponseText = responseText;

  // Extract and remove any raw base64 images that might contain whitespace/newlines
  const markdownBase64Regex = /!\[.*?\]\(\s*(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+)\s*\)/g;
  finalResponseText = finalResponseText.replace(markdownBase64Regex, (match, base64Str) => {
    const cleanBase64 = base64Str.replace(/\s+/g, '');
    if (!generatedImages.includes(cleanBase64)) {
      generatedImages.push(cleanBase64);
    }
    return ''; // Strip the markdown image from the text
  });

  // Also catch HTML img tags with base64
  const htmlImgRegex = /<img[^>]+src=["'](data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+)["'][^>]*>/gi;
  finalResponseText = finalResponseText.replace(htmlImgRegex, (match, base64Str) => {
    const cleanBase64 = base64Str.replace(/\s+/g, '');
    if (!generatedImages.includes(cleanBase64)) {
      generatedImages.push(cleanBase64);
    }
    return '';
  });

  // Also catch any bare data URIs floating in the text
  const bareBase64Regex = /data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\s]+/g;
  finalResponseText = finalResponseText.replace(bareBase64Regex, (match) => {
    const cleanBase64 = match.replace(/\s+/g, '');
    if (!generatedImages.includes(cleanBase64)) {
      generatedImages.push(cleanBase64);
    }
    return ''; // Strip it from the text
  });

  // Clean up any stray long base64 blocks that might have been output directly without data:image prefix
  const strayBase64 = /[A-Za-z0-9+/=]{1000,}/g;
  finalResponseText = finalResponseText.replace(strayBase64, '');

  // Once all base64 URIs are extracted into generatedImages, flush them to disk to strip size from Redux state
  for (let i = 0; i < generatedImages.length; i++) {
    if (generatedImages[i].startsWith('data:')) {
      try {
        const dirHandle = await dbService.getSetting("image_save_directory");
        if (dirHandle && typeof dirHandle.getFileHandle === 'function') {
          const mimeMatch = generatedImages[i].match(/data:(.*?);base64,/);
          const ext = mimeMatch && mimeMatch[1] === 'image/jpeg' ? 'jpg' : 'png';
          const filename = `gemini_img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();

          const base64Data = generatedImages[i].split(',')[1];
          const bstr = atob(base64Data);
          let n = bstr.length;
          let u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }

          await writable.write(u8arr.buffer);
          await writable.close();

          generatedImages[i] = `local:${filename}`; // Replace base64 in array with local reference
        }
      } catch (err) {
        console.warn("Failed to write fully extracted image to FileSystem API directory", err);
      }
    }
  }

  return finalResponseText;
};
