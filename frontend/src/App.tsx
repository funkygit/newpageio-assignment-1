import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from './components/ChatInterface';
import { FileUpload } from './components/FileUpload';
import { useState } from 'react';

const queryClient = new QueryClient();

function App() {
  const [provider, setProvider] = useState<'ollama' | 'openai' | 'gemini' | 'anthropic'>('ollama');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 p-8 flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-xl font-bold text-gray-800 mb-2">Local RAG</h1>
            <p className="text-sm text-gray-500">Secure, offline-ready document chat.</p>
          </div>

          <FileUpload />

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">LLM Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ollama">Ollama (Offline)</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
            <div className="mt-2 text-xs text-gray-500">
              {provider === 'ollama' ? 'Default: llama3' : 'Requires API Key'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <ChatInterface provider={provider} />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
