import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatInterface } from './components/ChatInterface';
import { FileUpload } from './components/FileUpload';
import { DocumentList } from './components/DocumentList';
import { useState, useEffect } from 'react';

const queryClient = new QueryClient();

function App() {
  const [provider, setProvider] = useState<'ollama' | 'openai' | 'gemini' | 'anthropic'>('ollama');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    if (provider === 'ollama') {
      import('./api').then(({ getModels }) => {
        getModels().then((data) => {
          setModels(data);
          if (data.length > 0) setSelectedModel(data[0]);
        }).catch(console.error);
      });
    }
  }, [provider]);

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
          <DocumentList />

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">LLM Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none mb-4"
            >
              <option value="ollama">Ollama (Offline)</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>

            {provider === 'ollama' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              {provider === 'ollama' ? 'Local Models' : 'Requires API Key'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <ChatInterface provider={provider} model={selectedModel} />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
