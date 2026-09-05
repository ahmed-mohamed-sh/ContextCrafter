import { db } from "@/lib/db";
import Groq from "groq-sdk";

export interface AISettings {
  provider: "groq" | "openai" | "ollama" | "deepinfra" | string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  userId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseFormat?: { type: "json_object" };
}

export async function getUserAISettings(userId: string): Promise<AISettings> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
  });

  const provider = (settings?.llmProvider || "groq").toLowerCase();
  const temperature = settings?.temperature ?? 0.2;
  const maxTokens = settings?.maxTokens ?? 4096;
  const customBaseUrl = settings?.customBaseUrl || undefined;

  let apiKey = settings?.llmApiKey || "";
  let defaultModel = "llama-3.3-70b-versatile";
  let baseUrl = customBaseUrl;

  if (provider === "openai") {
    apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    defaultModel = "gpt-4o";
    baseUrl = baseUrl || "https://api.openai.com/v1";
  } else if (provider === "deepinfra") {
    apiKey = apiKey || process.env.DEEPINFRA_API_KEY || "";
    defaultModel = "meta-llama/Meta-Llama-3-70B-Instruct";
    baseUrl = baseUrl || "https://api.deepinfra.com/v1/openai";
  } else if (provider === "ollama") {
    apiKey = apiKey || "ollama";
    defaultModel = "llama3";
    baseUrl = baseUrl || "http://localhost:11434/v1";
  } else {
    // Groq (default)
    apiKey = apiKey || process.env.GROQ_API_KEY || "";
    defaultModel = "llama-3.3-70b-versatile";
    baseUrl = baseUrl || "https://api.groq.com/openai/v1";
  }

  return {
    provider,
    apiKey,
    baseUrl,
    model: defaultModel,
    temperature,
    maxTokens,
  };
}

export async function generateAICompletion({
  userId,
  messages,
  temperature,
  maxTokens,
  model,
  responseFormat,
}: AICompletionOptions): Promise<{ content: string; model: string; provider: string }> {
  const aiSettings = await getUserAISettings(userId);
  const effectiveModel = model || aiSettings.model;
  const effectiveTemp = temperature !== undefined ? temperature : aiSettings.temperature;
  const effectiveMaxTokens = maxTokens !== undefined ? maxTokens : aiSettings.maxTokens;

  // 1. If provider is Groq and no custom base URL is supplied, use groq-sdk
  if (aiSettings.provider === "groq" && !aiSettings.baseUrl?.includes("localhost")) {
    if (!aiSettings.apiKey) {
      throw new Error("No Groq API key configured. Please set your GROQ_API_KEY in settings or environment.");
    }

    const groq = new Groq({ apiKey: aiSettings.apiKey });
    const completion = await groq.chat.completions.create({
      model: effectiveModel === "gpt-4o" ? "llama-3.3-70b-versatile" : effectiveModel,
      messages: messages as any,
      temperature: effectiveTemp,
      max_tokens: effectiveMaxTokens,
      response_format: responseFormat,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return {
      content,
      model: effectiveModel,
      provider: "groq",
    };
  }

  // 2. Generic OpenAI-compatible execution (works for OpenAI, Ollama, DeepInfra, LocalAI, vLLM)
  const endpoint = `${(aiSettings.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "")}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (aiSettings.apiKey && aiSettings.apiKey !== "ollama") {
    headers["Authorization"] = `Bearer ${aiSettings.apiKey.trim()}`;
  }

  const payload: any = {
    model: effectiveModel,
    messages,
    temperature: effectiveTemp,
    max_tokens: effectiveMaxTokens,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `AI Provider (${aiSettings.provider}) error ${res.status}: ${errText || res.statusText}`
    );
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    model: effectiveModel,
    provider: aiSettings.provider,
  };
}
