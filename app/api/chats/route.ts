import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

// Get all chats for the user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: chats, error } = await supabase
      .from('chats')
      .select('id, title, created_at, updated_at')
      .eq('user_email', session.user.email)
      .order('updated_at', { ascending: false });

    if (error) throw error;

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

    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        user_id: session.user.id || session.user.email,
        user_email: session.user.email,
        title,
        messages: [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}