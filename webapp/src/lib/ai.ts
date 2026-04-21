// src/lib/ai.ts
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "ap-south-1", 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function adaptParagraphSupport(
  paragraph: string,
  targetLanguage: string = 'English',
  isLongPause: boolean = false
) {
  try {
    const systemPrompt = `Act as an educational editor. Your task is to rewrite the provided text to make it more accessible for beginners. 

      Rules:
      1. Do not replace the original complex words. 
      2. Instead, provide a simple definition or synonym in parentheses immediately after the complex word.
      3. Keep the sentence structure and original meaning identical.
      4. If a sentence is already very simple, still find some top hard words and simplify them.
      5. Make sure the simplified word or phrase is less than 9 words
      
      Example Input: Photosynthesis is a biochemical process. It occurs in plants.
      Example Output: Photosynthesis (the process of making food using sunlight) is a biochemical (natural chemical) process. It occurs in plants.`;

    const userPrompt = `Adapt this text for a struggling reader:\n\n${paragraph}`;

    const command = new ConverseCommand({
      modelId: "qwen.qwen3-235b-a22b-2507-v1:0", 
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: "user",
          content: [{ text: userPrompt }]
        }
      ],
      inferenceConfig: { 
        maxTokens: 1500, 
        temperature: 0.3 
      }
    });

    console.log(`📤 Sending to AWS Bedrock: "${paragraph.substring(0, 50)}..."`);
    const response = await client.send(command);
    const adaptedText = response.output?.message?.content?.[0]?.text || '';
    
    console.log(`📥 AWS Bedrock Response: "${adaptedText.substring(0, 100)}..."`);
    
    if (!adaptedText || adaptedText.trim().length === 0) {
      console.warn("⚠️ AWS returned empty response, using original");
      return paragraph;
    }
    
    return adaptedText.trim();
    
  } catch (error: any) {
    console.error("🔴 AWS ERROR TYPE:", error.name); 
    console.error("🔴 AWS ERROR MESSAGE:", error.message);
    console.error("🔴 Full Error:", error);
    return paragraph;
  }
}

export async function adaptParagraphTranslate(
  paragraph: string,
  targetLanguage: string
) {
  try {
    const command = new ConverseCommand({
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      system: [{ text: "You are a translator. Maintain tone and formatting." }],
      messages: [
        {
          role: "user",
          content: [{ text: `Translate the following text into ${targetLanguage}. Maintain the original tone and formatting.\n\nText:\n"${paragraph}"` }]
        }
      ],
      inferenceConfig: { maxTokens: 1000, temperature: 0.5 }
    });

    console.log("DONeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee!")

    const response = await client.send(command);
    return response.output?.message?.content?.[0]?.text || paragraph;
  } catch (error: any) {
    console.error("AWS TRANSLATION ERROR:", error.message);
    return paragraph;
  }
}
