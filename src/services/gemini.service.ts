import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../utils/env";
import type { ChatMessage } from "../types";
import { AppError } from "../utils/app-error";

const SYSTEM_PROMPT =
  "You are a helpful e-commerce assistant. Use the provided Order Data to answer the user. If no Order Data is provided, politely ask for their email or order ID. Keep responses under 3 sentences.";

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

export const generateChatReply = async (
  history: ChatMessage[],
  latestMessage: string,
  orderData: string
): Promise<string> => {
  const conversation = history
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n");

  const prompt = [
    `Order Data:\n${orderData || "No Order Data is provided."}`,
    conversation ? `Conversation so far:\n${conversation}` : "",
    `User: ${latestMessage}`,
  ]
    .filter((section) => section.length > 0)
    .join("\n\n");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (!text) {
      throw new AppError("Empty response from assistant", 502);
    }

    return text;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error(error);
    throw new AppError("Failed to generate assistant reply", 502);
  }
};
