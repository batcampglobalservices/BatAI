import { streamText, UIMessage, convertToCoreMessages } from "ai";
import { google } from "@ai-sdk/google";

// 🚀 Main route handler
export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: google("gemini-1.5-flash-latest"),
      messages: convertToCoreMessages(messages),
    });

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
