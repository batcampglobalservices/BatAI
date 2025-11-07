import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { auth } from "@/auth";
import Chat from "@/models/Chat";
import connectDB from "@/lib/mongodb";
import { getPrompt } from "@/config/ai-prompts";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    // Extract messages and custom body data
    const messages = body.messages || [];
    const chatId = body.chatId;
    const promptKey = body.promptKey || "default";

    console.log('Parsed data:', { 
      promptKey, 
      messagesCount: messages?.length, 
      hasMessages: !!messages,
      chatId 
    });

    // Validate messages is an array
    if (!Array.isArray(messages)) {
      console.error('Messages is not an array:', messages);
      return new Response(JSON.stringify({ 
        error: "Invalid messages format - must be an array", 
        receivedType: typeof messages
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Connect to DB if we need to save the chat
    if (chatId) {
      await connectDB();
      // Verify chat belongs to user
      const chat = await Chat.findOne({
        _id: chatId,
        userEmail: session.user.email,
      });
      if (!chat) {
        return new Response("Chat not found", { status: 404 });
      }
    }

    const systemPrompt = getPrompt(promptKey);
    console.log('Using system prompt:', { promptKey, description: systemPrompt.description });

    // Convert messages safely
    const convertedMessages = messages.length > 0 ? convertToModelMessages(messages) : [];
    
    const result = streamText({
      model: google("gemini-1.5-flash"),
      messages: [
        systemPrompt,
        ...convertedMessages,
      ],
    });

    // Return streamed response
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming chat completion:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Full error details:", errorMessage);
    return new Response(JSON.stringify({ error: "Failed to stream chat completion", details: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}