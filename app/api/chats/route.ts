import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";

// Get all chats for the user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const chats = await Chat.find({ userEmail: session.user.email })
      .sort({ updatedAt: -1 })
      .select("_id title createdAt updatedAt")
      .lean();

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

// Create a new chat
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const title = body.title || "New Chat";

    await connectDB();
    const chat = await Chat.create({
      userId: session.user.id || session.user.email,
      userEmail: session.user.email,
      title,
      messages: [],
    });

    return NextResponse.json({ chat: chat.toObject() });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}