import React from 'react';
import { FileText, Trash2, Database, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, deleteDocument, type DocumentInfo } from '../api';

export const DocumentList: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: documents, isLoading, isError } = useQuery({
        queryKey: ['documents'],
        queryFn: getDocuments,
        refetchInterval: 10000, // Auto-refresh every 10 seconds
    });

    const deleteMutation = useMutation({
        mutationFn: deleteDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });

    const handleDelete = (doc: DocumentInfo) => {
        if (window.confirm(`Delete "${doc.source}" and its ${doc.chunks} chunks?`)) {
            deleteMutation.mutate(doc.document_id);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Database size={16} /> Ingested Documents
            </h3>

            {isLoading && (
                <div className="flex items-center justify-center py-4 text-gray-400">
                    <Loader2 size={18} className="animate-spin mr-2" />
                    <span className="text-sm">Loading...</span>
                </div>
            )}

            {isError && (
                <p className="text-sm text-red-500 py-2">Failed to load documents.</p>
            )}

            {!isLoading && !isError && documents && documents.length === 0 && (
                <p className="text-sm text-gray-400 py-2 text-center">No documents ingested yet.</p>
            )}

            {!isLoading && documents && documents.length > 0 && (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {documents.map((doc) => (
                        <li
                            key={doc.document_id}
                            className="flex items-center justify-between gap-2 p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors group"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText size={14} className="text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate" title={doc.source}>
                                        {doc.source}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(doc)}
                                disabled={deleteMutation.isPending}
                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title="Delete document"
                            >
                                <Trash2 size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
