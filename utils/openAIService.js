// utils/openaiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const askChatGPT = async (message) => {
  try {
    console.log(message);
    const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

    const result  = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    return text;

  } catch (error) {
    console.error('AI Error:', error);
    return 'Xin lỗi, tôi không thể phản hồi lúc này.';
  }
};
