
import { GoogleGenAI } from "@google/genai";
import { GenerationConfig, GenerationModel, GeneratedImage } from "../types.ts";

/**
 * Service to handle image generation and multi-turn editing.
 * Always obtains the API key from process.env.API_KEY as per instructions.
 */
export const generateImages = async (
  config: GenerationConfig,
  contextImage?: { base64: string; mimeType: string }
): Promise<GeneratedImage[]> => {
  const apiKey = config.apiKey || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("BYOK_REQUIRED");
  }

  const ai = new GoogleGenAI({ apiKey });
  const results: GeneratedImage[] = [];

  try {
    if (config.model === GenerationModel.IMAGEN_4) {
      const response = await ai.models.generateImages({
        model: config.model,
        prompt: config.prompt,
        config: {
          numberOfImages: config.numberOfImages,
          outputMimeType: config.outputFormat,
          aspectRatio: config.aspectRatio,
        },
      });

      for (const imgData of response.generatedImages) {
        const base64Bytes: string = imgData.image.imageBytes;
        results.push({
          id: Math.random().toString(36).substring(2, 11),
          url: `data:${config.outputFormat};base64,${base64Bytes}`,
          base64Data: base64Bytes,
          mimeType: config.outputFormat,
          prompt: config.prompt,
          model: config.model,
          timestamp: Date.now(),
        });
      }
    } else {
      // Gemini 2.5/3 series
      for (let i = 0; i < config.numberOfImages; i++) {
        const parts: any[] = [];

        // 1. Add current context image if multi-turn editing
        if (contextImage) {
          parts.push({
            inlineData: {
              data: contextImage.base64,
              mimeType: contextImage.mimeType
            }
          });
        }

        // 2. Add reference images (Up to 14 supported in Gemini 3 Pro Image)
        if (config.referenceImages && config.referenceImages.length > 0) {
          config.referenceImages.forEach(ref => {
            parts.push({
              inlineData: {
                data: ref.base64,
                mimeType: ref.mimeType
              }
            });
          });
        }

        // 3. Add prompt text
        parts.push({ text: config.prompt });

        const modelConfig: any = {
          imageConfig: {
            aspectRatio: config.aspectRatio,
            ...(config.model === GenerationModel.PRO_IMAGE ? { imageSize: config.imageSize } : {}),
          },
        };

        // Enable Google Search grounding only for Pro models
        if (config.googleSearch && config.model === GenerationModel.PRO_IMAGE) {
          modelConfig.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
          model: config.model,
          contents: { parts },
          config: modelConfig,
        });

        const candidates = response.candidates || [];
        if (candidates.length > 0) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
              const base64Data: string = part.inlineData.data;
              results.push({
                id: Math.random().toString(36).substring(2, 11),
                url: `data:${part.inlineData.mimeType};base64,${base64Data}`,
                base64Data: base64Data,
                mimeType: part.inlineData.mimeType,
                prompt: config.prompt,
                model: config.model,
                timestamp: Date.now(),
              });
            }
          }
        }
      }
    }

    if (results.length === 0) {
      throw new Error("The model did not return any image. Try adjusting your prompt.");
    }

    return results;
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    if (error?.message?.includes("Requested entity was not found.")) {
      throw new Error("BYOK_REQUIRED");
    }
    throw error;
  }
};
