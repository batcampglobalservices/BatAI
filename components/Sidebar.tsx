"use client";

import { useState, useEffect } from "react";

interface Chat {
  _id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  currentChatId?: string;
  onSelect: (chatId: string) => void;
  onCreate: () => Promise<void>;
  onDelete: (chatId: string) => Promise<void>;
}

export default function Sidebar({ currentChatId, onSelect, onCreate, onDelete }: SidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/chats");
      const data = await res.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const handleCreateNewChat = async () => {
    await onCreate();
    fetchChats();
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chat?")) return;

    try {
      await onDelete(id);
      fetchChats();
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="flex flex-col h-full p-4">
          {/* New Chat Button */}
          <button
            onClick={handleCreateNewChat}
            className="w-full mb-4 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
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
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2 px-2">
              Chat History
            </h3>
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => onSelect(chat._id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentChatId === chat._id
                      ? "bg-zinc-200 dark:bg-zinc-800"
                      : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 hover:text-white rounded transition-all"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}