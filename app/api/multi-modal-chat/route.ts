import { streamText, convertToCoreMessages } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/auth";
import Chat from "@/models/Chat";
import connectDB from "@/lib/mongodb";
import { getPrompt } from "@/config/ai-prompts";

// 🧩 Message type (includes system for compatibility)
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// 🧠 Request body type
interface ChatRequestBody {
  messages: Message[];
  chatId?: string;
  promptKey?: string;
}

// 🚀 Main route handler
export async function POST(req: Request): Promise<Response> {
  try {
    // 🔒 Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 📨 Parse request body safely
    const body: ChatRequestBody = await req.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));

    const { messages = [], chatId, promptKey = "default" } = body;

    console.log("Parsed data:", {
      promptKey,
      messagesCount: messages?.length,
      hasMessages: Array.isArray(messages),
      chatId,
    });

    // ✅ Validate messages array
    if (!Array.isArray(messages)) {
      console.error("Messages is not an array:", messages);
      return new Response(
        JSON.stringify({
          error: "Invalid messages format - must be an array",
          receivedType: typeof messages,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 🗄️ Connect to DB if chatId provided
    if (chatId) {
      await connectDB();
      const chat = await Chat.findOne({
        _id: chatId,
        userEmail: session.user.email,
      });

      if (!chat) {
        return new Response("Chat not found", { status: 404 });
      }
    }

    // 🧠 Load system prompt
    const systemPrompt = getPrompt(promptKey);
    console.log("Using system prompt:", {
      promptKey,
      description: systemPrompt?.description,
    });

    if (!systemPrompt?.content) {
      return new Response(
        JSON.stringify({
          error: "Invalid prompt key",
          promptKey,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 🔁 Convert user messages to AI model format
    const convertedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 🤖 Stream AI response using Google Gemini
    const result = streamText({
      model: google("gemini-1.5-flash"), // ✅ correct model name
      system: systemPrompt.content,
      messages: convertedMessages,
    });

    // 🚀 Return a streamable text response (correct for TypeScript)
    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("Error streaming chat completion:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "Failed to stream chat completion",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
