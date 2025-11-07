"use client";

import { useState } from 'react';
import { aiPrompts, AIPrompt } from '@/config/ai-prompts';

interface PromptSelectorProps {
  onSelect: (prompt: AIPrompt & { key: string }) => void;
  currentPrompt?: string;
}

export default function PromptSelector({ onSelect, currentPrompt = 'default' }: PromptSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (promptKey: string) => {
    const prompt = aiPrompts[promptKey];
    if (prompt) {
      onSelect({ ...prompt, key: promptKey });
      setIsOpen(false);
    }
  };

  const promptCategories = Object.entries(aiPrompts).reduce<Record<string, typeof aiPrompts>>(
    (acc, [key, prompt]) => {
      if (!acc[prompt.category]) {
        acc[prompt.category] = {};
      }
      acc[prompt.category][key] = prompt;
      return acc;
    },
    {}
  );

  return (
    <div className="relative">
      <button
        type="button" // Prevent form submission
        onClick={(e) => {
          e.preventDefault(); // Prevent form submission
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {aiPrompts[currentPrompt]?.description || 'General Assistant'}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-2">
          {Object.entries(promptCategories).map(([category, prompts]) => (
            <div key={category}>
              <div className="px-3 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                {category}
              </div>
              {Object.entries(prompts).map(([key, prompt]) => (
                <button
                  type="button" // Prevent form submission
                  key={key}
                  onClick={(e) => {
                    e.preventDefault(); // Prevent form submission
                    handleSelect(key);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${
                    currentPrompt === key
                      ? 'bg-zinc-100 dark:bg-zinc-700 text-blue-600 dark:text-blue-400'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {prompt.description}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}