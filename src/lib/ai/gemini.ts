import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    // Warn but don't error immediately, similar to how openai might be handled
    // console.warn('Missing GEMINI_API_KEY environment variable');
}

export const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');

// Helper for getting the model
export const getGeminiModel = (modelName: string = 'gemini-1.5-flash') => {
    return genAI.getGenerativeModel({ model: modelName });
};
