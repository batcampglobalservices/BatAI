import { streamText, CoreMessage } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/auth";
import Chat from "@/models/Chat";
import connectDB from "@/lib/mongodb";
import { getPrompt } from "@/config/ai-prompts";

// 🚀 Main route handler
export async function POST(req: Request): Promise<Response> {
  try {
    // 🔒 Authenticate user
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 📨 Parse request body safely
    const body = await req.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));

    // Extract data from request
    const messages: CoreMessage[] = body.messages || [];
    const chatId = body.chatId;
    const promptKey = body.promptKey || "default";

    console.log("Parsed data:", {
      promptKey,
      messagesCount: messages?.length,
      hasMessages: Array.isArray(messages),
      chatId,
      bodyKeys: Object.keys(body),
    });

    // ✅ Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("Invalid messages:", messages);
      return new Response(
        JSON.stringify({
          error: "Invalid messages format - must be a non-empty array",
          receivedType: typeof messages,
          receivedBody: body,
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

    // 🤖 Stream AI response using Google Gemini
    const result = streamText({
      model: google("gemini-1.5-flash"), // ✅ correct model name
      system: systemPrompt.content,
      messages: messages,
    });

    // 🚀 Return a streamable response for the UI
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
