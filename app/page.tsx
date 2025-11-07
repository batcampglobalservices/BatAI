"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import PromptSelector from "@/components/PromptSelector";
import { AIPrompt, getPrompt } from "@/config/ai-prompts";
import { UIMessage } from "ai";

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md p-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Welcome to BatAI
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Sign in to continue to your Friendly AI assistant
            </p>
          </div>

          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="font-semibold">Continue with GitHub</span>
          </button>

          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams?.get("chat");

  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [currentPrompt, setCurrentPrompt] = useState<string>("default");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/multi-modal-chat",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        chatId: currentChatId,
        promptKey: currentPrompt,
      },
    }),
    id: currentChatId || undefined,
  });

  // Load chat when chatId changes
  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
      loadChat(chatId);
    } else {
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [chatId]);

  // Save messages to database
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      saveChat();
    }
  }, [messages, currentChatId]);

  const loadChat = async (id: string) => {
    try {
      const res = await fetch(`/api/chats/${id}`);
      const data = await res.json();
      if (data.chat) {
          const loadedMessages = data.chat.messages.map(
          (msg: { role: string; content: string }) => ({
            id: Math.random().toString(),
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            text: msg.content,
          } as Message)
        );
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const saveChat = async () => {
    if (!currentChatId) return;

    const simplifiedMessages = messages.map((msg) => ({
      role: msg.role,
      content: String(msg.parts?.[0]?.type === 'text' ? (msg.parts[0] as any).text : ''),
      timestamp: new Date(),
    }));

    // Generate title from first user message
    const firstUserMessage = messages.find((m) => m.role === "user");
    const title = (firstUserMessage?.parts?.[0]?.type === 'text' 
      ? String((firstUserMessage.parts[0] as any).text)
      : "New Chat").slice(0, 50);

    try {
      await fetch(`/api/chats/${currentChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: simplifiedMessages, title }),
      });
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  };

  const handleCreateChat = async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const data = await res.json();
      router.push(`/?chat=${data.chat._id}`);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const handleSelectChat = (chatId: string) => {
    router.push(`/?chat=${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (currentChatId === chatId) {
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Create new chat if none exists
    if (!currentChatId) {
      await handleCreateChat();
      return;
    }

    sendMessage({
      text: input,
      files,
    });
    setInput("");
    setFiles(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar
        currentChatId={currentChatId || undefined}
        onSelect={handleSelectChat}
        onCreate={handleCreateChat}
        onDelete={handleDeleteChat}
      />

      <div className="flex-1 flex flex-col pl-16 lg:pl-0">
        <div className="flex flex-col w-full max-w-3xl mx-auto pt-20 pb-36 px-4">
          {/* User Info & Sign Out */}
          <div className="fixed top-0 right-0 p-4 flex items-center gap-3 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm z-20">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {session.user?.name}
            </span>
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full ring-2 ring-zinc-200 dark:ring-zinc-800"
              />
            )}
            <button
              onClick={() => signOut()}
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
              {error.message}
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id} className="mb-6">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {message.role === "user" ? "You:" : "AI:"}
              </div>
              <div
                key={message.id}
                className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg"
              >
                {message.parts?.[0]?.type === 'text' ? (message.parts[0] as any).text : ''}
              </div>
            </div>
          ))}

          {(status === "submitted" || status === "streaming") && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-600 dark:border-zinc-400"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              // Only submit if Enter was pressed in the input field
              const target = e.target as HTMLFormElement;
              const activeElement = document.activeElement;
              if (activeElement && activeElement.tagName === 'BUTTON') {
                e.preventDefault();
                return;
              }
              handleSubmit(e);
            }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shadow-lg"
          >
            <div className="max-w-3xl mx-auto flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <PromptSelector
                  currentPrompt={currentPrompt}
                  onSelect={(prompt) => {
                    console.log('Selected prompt:', prompt);
                    setCurrentPrompt(prompt.key);
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                  {files?.length
                    ? `${files.length} file${files.length > 1 ? "s" : ""} attached`
                    : "Attach files"}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) {
                      setFiles(event.target.files);
                    }
                  }}
                  multiple
                  ref={fileInputRef}
                />
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="How can I help you?"
                />
                {status === "submitted" || status === "streaming" ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors shadow-lg font-semibold"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-semibold"
                    disabled={status !== "ready"}
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
