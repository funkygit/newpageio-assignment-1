import React, { useCallback, useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { uploadDocument } from '../api';
import clsx from 'clsx';

export const FileUpload: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [fileName, setFileName] = useState('');
    const [chunks, setChunks] = useState(0);

    const mutation = useMutation({
        mutationFn: uploadDocument,
        onSuccess: (data) => {
            setStatus('success');
            setFileName(data.filename);
            setChunks(data.chunks);
        },
        onError: () => {
            setStatus('error');
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileName(file.name);
            setStatus('uploading');
            mutation.mutate(file);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText size={16} /> Document Upload
            </h3>

            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.docx,.txt,.md"
                    disabled={status === 'uploading'}
                />

                {status === 'idle' && (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                        <Upload size={24} />
                        <span className="text-sm">Click or Drag file here</span>
                    </div>
                )}

                {status === 'uploading' && (
                    <div className="flex flex-col items-center gap-2 text-blue-500 animate-pulse">
                        <Upload size={24} />
                        <span className="text-sm">Processing...</span>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-2 text-green-600">
                        <CheckCircle size={24} />
                        <span className="text-sm font-medium">{fileName}</span>
                        <span className="text-xs text-gray-500">Processed {chunks} chunks</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-2 text-red-500">
                        <AlertCircle size={24} />
                        <span className="text-sm">Upload failed</span>
                    </div>
                )}
            </div>
        </div>
    );
};
