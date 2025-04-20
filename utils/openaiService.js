// utils/openaiService.js
import axios from 'axios';
import { OPENAI_API_KEY } from '@env';

const API_KEY = OPENAI_API_KEY;

export const askChatGPT = async (message) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Error:', error);
    return 'Xin lỗi, tôi không thể phản hồi lúc này.';
  }
};
