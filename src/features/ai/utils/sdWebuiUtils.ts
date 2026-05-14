import { appendCharacterImages } from "./imageProcessing";
import { getStoredValue } from "./settings";
import {
  LS_SD_WEBUI_API_URL,
  DEFAULT_SD_WEBUI_API_URL,
  LS_SD_WEBUI_REF_MODE,
  DEFAULT_SD_WEBUI_REF_MODE,
  LS_SD_WEBUI_DENOISING,
  DEFAULT_SD_WEBUI_DENOISING,
  LS_SD_WEBUI_CONTROLNET_MODEL,
  DEFAULT_SD_WEBUI_CONTROLNET_MODEL,
  LS_SD_WEBUI_MODEL,
  DEFAULT_SD_WEBUI_MODEL,
  LS_SD_WEBUI_BATCH_SIZE,
  DEFAULT_SD_WEBUI_BATCH_SIZE,
  LS_IMAGE_RESOLUTION,
  DEFAULT_IMAGE_RESOLUTION,
} from "../../../utils/constants";

export const generateSDImage = async (
  derivedImagePrompt: string,
  derivedParams: any,
  characterImages?: string[]
): Promise<string[]> => {
  const generatedImages: string[] = [];

  const sdApiUrl = getStoredValue(LS_SD_WEBUI_API_URL, DEFAULT_SD_WEBUI_API_URL);
  const refMode = getStoredValue<string>(LS_SD_WEBUI_REF_MODE, DEFAULT_SD_WEBUI_REF_MODE);
  const denoising = getStoredValue(LS_SD_WEBUI_DENOISING, DEFAULT_SD_WEBUI_DENOISING, parseFloat);
  const controlnetModel = getStoredValue(LS_SD_WEBUI_CONTROLNET_MODEL, DEFAULT_SD_WEBUI_CONTROLNET_MODEL);
  const sdModel = getStoredValue(LS_SD_WEBUI_MODEL, DEFAULT_SD_WEBUI_MODEL);
  const batchSize = getStoredValue(LS_SD_WEBUI_BATCH_SIZE, DEFAULT_SD_WEBUI_BATCH_SIZE, parseInt);

  const resolution = getStoredValue(LS_IMAGE_RESOLUTION, DEFAULT_IMAGE_RESOLUTION);
  const [widthStr, heightStr] = resolution.split('x');
  const width = parseInt(widthStr) || 512;
  const height = parseInt(heightStr) || 512;

  // Extract character image if reference mode is used
  let refImageBase64 = null;
  if (refMode !== "none" && characterImages && characterImages.length > 0) {
    const tempParts: any[] = [];
    await appendCharacterImages(tempParts, characterImages);
    if (tempParts.length > 0 && tempParts[0].inlineData) {
      refImageBase64 = tempParts[0].inlineData.data;
    }
  }

  let endpoint = '/sdapi/v1/txt2img';
  const payload: any = {
    prompt: derivedImagePrompt,
    negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
    width: derivedParams.width || width,
    height: derivedParams.height || height,
    steps: derivedParams.steps || 20,
    sampler_name: derivedParams.sampler_name || "Euler a",
    batch_size: batchSize,
  };
  
  if (derivedParams.cfg_scale !== undefined) payload.cfg_scale = derivedParams.cfg_scale;
  if (derivedParams.seed !== undefined) payload.seed = derivedParams.seed;

  if (sdModel) {
    payload.override_settings = {
      sd_model_checkpoint: sdModel
    };
  }

  if (refImageBase64) {
    if (refMode === "img2img") {
      endpoint = '/sdapi/v1/img2img';
      payload.init_images = [refImageBase64];
      payload.denoising_strength = denoising;
    } else if (refMode === "controlnet") {
      payload.alwayson_scripts = {
        controlnet: {
          args: [
            {
              input_image: refImageBase64,
              model: controlnetModel,
              enabled: true
            }
          ]
        }
      };
    } else if (refMode === "reactor") {
      payload.alwayson_scripts = {
        reactor: {
          args: [
            refImageBase64,       // 0: img
            true,                 // 1: enable
            '0',                  // 2: source faces index
            '0',                  // 3: target faces index
            'inswapper_128.onnx', // 4: model path
            'None',               // 5: restorer name (Disabled to keep max resemblance)
            0,                    // 6: restorer visibility
            false,                // 7: restore face (false ensures inswapper doesn't get smoothed over)
            'None',               // 8: upscaler name
            1.0,                  // 9: upscaler visibility
            1.0,                  // 10: upscaler scale 
            1.0,                  // 11: blend
            0,                    // 12: gender filter
            false                 // 13: save original
          ]
        }
      };
    }
  }

  const response = await fetch(`${sdApiUrl.replace(/\/$/, '')}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`SD WebUI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.images && data.images.length > 0) {
    for (const base64d of data.images) {
      generatedImages.push(`data:image/png;base64,${base64d}`);
    }
  } else {
    throw new Error("No images returned from SD WebUI");
  }

  return generatedImages;
};
