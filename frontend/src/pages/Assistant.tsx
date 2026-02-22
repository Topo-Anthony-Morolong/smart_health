import { useState, useRef, useEffect } from 'react';
import { api, AssistantResponse } from '@/lib/api';
import { Bot, SendHorizonal, Loader2, AlertCircle, Stethoscope, RefreshCw } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    topic?: string;
    disclaimer?: string;
}

const SUGGESTED = [
    'What are the symptoms of Type 2 Diabetes?',
    'How can I lower my blood pressure naturally?',
    'What does a high cholesterol reading mean?',
    'When should I seek emergency care for chest pain?',
    'What is BMI and why does it matter?',
];

export function Assistant() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm the Smart Health Virtual Assistant. I can answer general health questions to support your care. Please note that I'm not a substitute for professional medical advice. How can I assist you today?",
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async (question: string) => {
        if (!question.trim() || loading) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: question.trim() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response: AssistantResponse = await api.askAssistant(question.trim());
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response,
                topic: response.topic,
                disclaimer: response.disclaimer,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'I was unable to process your question at this time. Please ensure the backend service is running and try again.',
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm the Smart Health Virtual Assistant. How can I assist you today?",
        }]);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full max-h-screen bg-slate-50">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-teal-500 p-2.5 rounded-xl text-white shadow-md">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Virtual Health Assistant</h1>
                        <p className="text-xs text-slate-500 font-medium">AI-powered clinical guidance · No external API required</p>
                    </div>
                </div>
                <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" /> New Chat
                </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                                <Stethoscope className="h-4 w-4" />
                            </div>
                        )}
                        <div className={`max-w-[75%] space-y-2`}>
                            {msg.topic && (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    {msg.topic}
                                </span>
                            )}
                            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                                }`}>
                                {msg.content}
                            </div>
                            {msg.disclaimer && (
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    {msg.disclaimer}
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3 justify-start">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                            <Stethoscope className="h-4 w-4" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <span className="text-sm text-slate-500">Analysing your question…</span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggestions (show only at start) */}
            {messages.length === 1 && (
                <div className="px-6 pb-3 flex flex-wrap gap-2">
                    {SUGGESTED.map(s => (
                        <button key={s} onClick={() => sendMessage(s)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="px-6 pb-6 pt-2 bg-white border-t border-slate-200">
                <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-3">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask a health question…"
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        disabled={loading}
                    />
                    <button type="submit" disabled={!input.trim() || loading}
                        className="px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                        <SendHorizonal className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
