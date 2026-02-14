import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useMutation } from '@tanstack/react-query';
import { sendMessage, type ChatMessage } from '../api';
import clsx from 'clsx';

interface ChatInterfaceProps {
    provider: 'ollama' | 'openai' | 'gemini' | 'anthropic';
    model?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ provider, model }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const mutation = useMutation({
        mutationFn: sendMessage,
        onSuccess: (data) => {
            setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
        },
        onError: (error) => {
            console.error(error);
            setHistory(prev => [...prev, { role: 'assistant', content: "Error communicating with server." }]);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        setHistory(prev => [...prev, userMsg]);
        setInput('');

        mutation.mutate({
            message: input,
            provider,
            model,
            history: history
        });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, mutation.isPending]);

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Start chatting with your documents!</p>
                    </div>
                )}

                {history.map((msg, idx) => (
                    <div key={idx} className={clsx("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            msg.role === 'user' ? "bg-blue-500 text-white" : "bg-emerald-600 text-white")}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={clsx("max-w-[80%] rounded-lg p-3 text-sm",
                            msg.role === 'user' ? "bg-blue-500 text-white" : "bg-white border border-gray-200 shadow-sm text-gray-900")}>
                            <div className={clsx("prose prose-sm max-w-none text-gray-900", msg.role === 'user' ? "text-white" : "")}>
                                <ReactMarkdown>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {mutation.isPending && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                            <span className="text-gray-400 text-sm">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={mutation.isPending}
                    />
                    <button
                        type="submit"
                        disabled={mutation.isPending || !input.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};
