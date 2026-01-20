'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Upload, CheckCircle, XCircle, Loader2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface BulkJobImportProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface JobImportResult {
    url: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    message?: string;
    jobData?: any;
}

export function BulkJobImport({ open, onClose, onSuccess }: BulkJobImportProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [urls, setUrls] = useState<string[]>([]);
    const [results, setResults] = useState<JobImportResult[]>([]);
    const router = useRouter();

    const extractUrlsFromFile = async (file: File): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

                    // Extract all URLs from all columns
                    const extractedUrls: string[] = [];

                    jsonData.forEach((row) => {
                        row.forEach((cell) => {
                            const cellStr = String(cell || '').trim();
                            // Check if cell contains a URL
                            if (cellStr && (cellStr.startsWith('http://') || cellStr.startsWith('https://'))) {
                                extractedUrls.push(cellStr);
                            }
                        });
                    });

                    if (extractedUrls.length === 0) {
                        reject(new Error('No URLs found in the Excel file. Make sure cells contain valid http/https URLs.'));
                    } else {
                        resolve(extractedUrls);
                    }
                } catch (error) {
                    reject(new Error('Failed to parse Excel file. Please ensure it\'s a valid .xlsx or .xls file.'));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsBinaryString(file);
        });
    };

    const handleFile = async (file: File) => {
        try {
            const extractedUrls = await extractUrlsFromFile(file);
            setUrls(extractedUrls);
            setResults(extractedUrls.map(url => ({ url, status: 'pending' })));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process file');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            handleFile(file);
        } else {
            toast.warning('Please upload an Excel file (.xlsx, .xls) or CSV file');
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const processBulkImport = async () => {
        setIsProcessing(true);

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            // Update status to processing
            setResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: 'processing' } : r
            ));

            try {
                const response = await fetch('/api/jobs/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });

                const data = await response.json();

                if (response.ok) {
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? {
                            ...r,
                            status: 'success',
                            message: data.delegated ? 'Delegated to VA' : 'Imported',
                            jobData: data.data,
                        } : r
                    ));
                } else {
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? {
                            ...r,
                            status: 'error',
                            message: data.error || 'Import failed',
                        } : r
                    ));
                }
            } catch (error) {
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? {
                        ...r,
                        status: 'error',
                        message: 'Network error',
                    } : r
                ));
            }

            // Small delay between requests to avoid rate limiting
            if (i < urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        setIsProcessing(false);
        router.refresh();
        onSuccess?.();
    };

    const handleClose = () => {
        setUrls([]);
        setResults([]);
        setIsProcessing(false);
        onClose();
    };

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Bulk Job Import
                    </DialogTitle>
                    <DialogDescription>
                        Upload an Excel file with job URLs to delegate multiple applications at once
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {urls.length === 0 ? (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
                                }`}
                        >
                            <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Drop your Excel file here
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                or click to browse
                            </p>
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileInput}
                                className="hidden"
                                id="bulk-file-input"
                            />
                            <label htmlFor="bulk-file-input">
                                <Button asChild variant="outline">
                                    <span className="cursor-pointer">Choose File</span>
                                </Button>
                            </label>
                            <p className="text-xs text-gray-500 mt-4">
                                Supports .xlsx, .xls, and .csv files. URLs can be in any column.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {urls.length} URLs found
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            {successCount > 0 && `${successCount} delegated`}
                                            {successCount > 0 && errorCount > 0 && ' • '}
                                            {errorCount > 0 && `${errorCount} failed`}
                                        </p>
                                    </div>
                                    {!isProcessing && results.every(r => r.status === 'pending') && (
                                        <Button onClick={processBulkImport} className="shrink-0">
                                            Start Import
                                        </Button>
                                    )}
                                    {isProcessing && (
                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Processing...
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Results List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {results.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border transition-all ${result.status === 'success' ? 'bg-green-50 border-green-200' :
                                                result.status === 'error' ? 'bg-red-50 border-red-200' :
                                                    result.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                                                        'bg-white border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="shrink-0 mt-0.5">
                                                {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                                {result.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                                                {result.status === 'processing' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                                                {result.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-gray-300" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {result.url}
                                                </p>
                                                {result.message && (
                                                    <p className={`text-xs mt-1 ${result.status === 'success' ? 'text-green-700' :
                                                            result.status === 'error' ? 'text-red-700' :
                                                                'text-gray-600'
                                                        }`}>
                                                        {result.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                        {results.length > 0 && !isProcessing ? 'Done' : 'Cancel'}
                    </Button>
                    {urls.length > 0 && !isProcessing && (
                        <Button
                            variant="outline"
                            onClick={() => { setUrls([]); setResults([]); }}
                            className="flex-1"
                        >
                            Upload Different File
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
