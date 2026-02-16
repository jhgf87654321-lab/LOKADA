
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateTextResponse = async (prompt: string, history: any[]) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are LOKADA AI Design Assistant. Help users develop workwear products. Respond concisely in Chinese. If the user asks for design modifications, confirm the request and provide specific design suggestions or specs.",
    }
  });

  const response = await chat.sendMessage({ message: prompt });
  return response.text;
};

export const generateDesignImage = async (prompt: string, baseImageB64?: string) => {
  const ai = getAIClient();
  
  const contents: any = {
    parts: [{ text: `Generate a professional high-quality product photo for industrial workwear: ${prompt}. Cinematic lighting, clean background, 4k detail.` }]
  };

  if (baseImageB64) {
    contents.parts.unshift({
      inlineData: {
        data: baseImageB64,
        mimeType: 'image/png'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents,
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  let imageUrl = '';
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }
  
  return imageUrl;
};
