import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('Missing OPENAI_API_KEY environment variable');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

// For backward compatibility - lazy getter
export const openai = {
    get chat() {
        return getOpenAI().chat;
    },
    get completions() {
        return getOpenAI().completions;
    },
    get embeddings() {
        return getOpenAI().embeddings;
    },
    get files() {
        return getOpenAI().files;
    },
    get images() {
        return getOpenAI().images;
    },
    get models() {
        return getOpenAI().models;
    },
    get moderations() {
        return getOpenAI().moderations;
    },
    get audio() {
        return getOpenAI().audio;
    },
};
