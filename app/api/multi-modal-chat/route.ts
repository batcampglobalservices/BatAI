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
    console.log('Received request body:', body);

    const { messages, chatId, promptKey = "default" }: { 
      messages?: UIMessage[]; 
      chatId?: string;
      promptKey?: string;
    } = body;

    console.log('Received request:', { promptKey, messagesCount: messages?.length, hasMessages: !!messages });

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages);
      return new Response(JSON.stringify({ error: "Invalid messages format", receivedType: typeof messages }), { 
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

    const result = streamText({
      model: google("gemini-1.5-flash"),
      messages: [
        systemPrompt,
        ...convertToModelMessages(messages),
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