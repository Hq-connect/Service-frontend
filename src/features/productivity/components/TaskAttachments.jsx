import React, { useRef, useState, useEffect } from 'react';
import { useTaskAttachments, useCreateTaskAttachment, useDeleteTaskAttachment } from '../queries/taskDetails.queries';
import { 
    Paperclip, Trash2, Download, FileText, Loader2, Eye, ExternalLink, X, 
    Image as ImageIcon, FileArchive, Film, Music, FileSpreadsheet
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSelector } from 'react-redux';

const TaskAttachments = ({ projectId, taskId }) => {
    const { data: attachmentsResponse, isLoading } = useTaskAttachments(projectId, taskId);
    const { mutate: createAttachment, isPending: isUploading } = useCreateTaskAttachment();
    const { mutate: deleteAttachment, isPending: isDeleting } = useDeleteTaskAttachment();
    
    const fileInputRef = useRef(null);
    const currentUser = useSelector((state) => state.auth?.user);

    const [previewAttachment, setPreviewAttachment] = useState(null);

    const attachments = attachmentsResponse?.data?.attachments || [];

    // Close preview on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setPreviewAttachment(null);
        };
        if (previewAttachment) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [previewAttachment]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        createAttachment(
            { projectId, taskId, file },
            {
                onSuccess: () => {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }
        );
    };

    const isImage = (mimeType) => mimeType?.startsWith('image/');
    const isVideo = (mimeType) => mimeType?.startsWith('video/');
    const isAudio = (mimeType) => mimeType?.startsWith('audio/');
    const isPdf = (mimeType) => mimeType === 'application/pdf';
    const isArchive = (mimeType) => mimeType?.includes('zip') || mimeType?.includes('compressed');
    const isSpreadsheet = (mimeType) => mimeType?.includes('sheet') || mimeType?.includes('excel') || mimeType?.includes('csv');

    const getFileIcon = (mimeType) => {
        if (isImage(mimeType)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
        if (isPdf(mimeType)) return <FileText className="w-5 h-5 text-red-500" />;
        if (isVideo(mimeType)) return <Film className="w-5 h-5 text-purple-500" />;
        if (isAudio(mimeType)) return <Music className="w-5 h-5 text-amber-500" />;
        if (isArchive(mimeType)) return <FileArchive className="w-5 h-5 text-yellow-600" />;
        if (isSpreadsheet(mimeType)) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
        return <FileText className="w-5 h-5 text-zinc-500" />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (isLoading) {
        return <div className="h-24 bg-zinc-100 animate-pulse rounded-xl" />;
    }

    return (
        <div className="space-y-4">
            
            {/* Upload Drag & Drop Area */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50 rounded-xl p-5 sm:p-6 text-center transition-all cursor-pointer group"
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-500 group-hover:text-zinc-800">
                    {isUploading ? (
                        <>
                            <Loader2 className="w-7 h-7 animate-spin text-zinc-600" />
                            <span className="text-sm font-semibold text-zinc-700">Uploading attachment to cloud...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-zinc-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Paperclip className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-zinc-800">
                                    Click to upload or drag & drop files
                                </p>
                                <p className="text-xs text-zinc-400">
                                    Images, PDFs, documents, media, or archives (up to 10MB)
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Attachments Grid */}
            {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {attachments.map((attachment) => {
                        const fileUrl = attachment.url || attachment.fileUrl;
                        const fileName = attachment.originalName || attachment.fileName || 'Attachment';
                        const fileType = attachment.mimeType || attachment.fileType;
                        const fileSize = attachment.size || attachment.fileSize;
                        const imageFile = isImage(fileType);

                        return (
                            <div 
                                key={attachment._id} 
                                className="group relative flex flex-col bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                            >
                                {/* Media Thumbnail / Preview Header */}
                                {imageFile ? (
                                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 group/thumbnail cursor-pointer">
                                        <img 
                                            src={fileUrl} 
                                            alt={fileName} 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover/thumbnail:scale-105"
                                            onClick={() => setPreviewAttachment({ url: fileUrl, name: fileName, size: fileSize, type: fileType })}
                                        />
                                        
                                        {/* Hover Overlay with Preview & Open */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumbnail:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewAttachment({ url: fileUrl, name: fileName, size: fileSize, type: fileType });
                                                }}
                                                className="px-2.5 py-1.5 bg-white text-zinc-900 rounded-lg text-xs font-semibold shadow hover:bg-zinc-100 flex items-center gap-1.5 transition-transform hover:scale-105"
                                                title="Preview image"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Preview</span>
                                            </button>
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition-transform hover:scale-105"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Open</span>
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-white rounded-lg border border-zinc-200 shadow-xs">
                                                {getFileIcon(fileType)}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                                {fileType?.split('/')[1]?.slice(0, 8) || 'FILE'}
                                            </span>
                                        </div>
                                        <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-md hover:bg-white transition-colors"
                                            title="Open file in new tab"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                )}

                                {/* File Details & Actions Footer */}
                                <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                                    <div>
                                        <p 
                                            className="text-xs font-semibold text-zinc-900 truncate cursor-pointer hover:text-blue-600 transition-colors" 
                                            title={fileName}
                                            onClick={() => imageFile && setPreviewAttachment({ url: fileUrl, name: fileName, size: fileSize, type: fileType })}
                                        >
                                            {fileName}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                                            <span>{formatFileSize(fileSize)}</span>
                                            <span>•</span>
                                            <span>{attachment.createdAt ? formatDistanceToNow(new Date(attachment.createdAt)) + ' ago' : 'Recently'}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                                        <div className="flex items-center gap-1">
                                            {imageFile && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewAttachment({ url: fileUrl, name: fileName, size: fileSize, type: fileType })}
                                                    className="inline-flex items-center gap-1 px-2 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Preview</span>
                                                </button>
                                            )}
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Open</span>
                                            </a>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <a 
                                                href={fileUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                download
                                                className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors"
                                                title="Download file"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </a>
                                            {(currentUser && (attachment.uploadedBy === currentUser._id || attachment.uploadedBy === currentUser.id)) && (
                                                <button
                                                    type="button"
                                                    onClick={() => deleteAttachment({ projectId, taskId, attachmentId: attachment._id })}
                                                    disabled={isDeleting}
                                                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                    title="Delete attachment"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* In-App Full Image Lightbox Preview Modal */}
            {previewAttachment && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setPreviewAttachment(null)}
                >
                    {/* Top Control Bar */}
                    <div 
                        className="w-full max-w-5xl flex items-center justify-between text-white/90 pb-4 border-b border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 truncate pr-4">
                            <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" />
                            <div className="truncate">
                                <p className="text-sm font-semibold text-white truncate">{previewAttachment.name}</p>
                                <p className="text-xs text-white/60">{formatFileSize(previewAttachment.size)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href={previewAttachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
                                title="Open full resolution in new tab"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open in Tab</span>
                            </a>
                            <a
                                href={previewAttachment.url}
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-zinc-900 hover:bg-white/90 rounded-lg text-xs font-semibold transition-colors"
                                title="Download file"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => setPreviewAttachment(null)}
                                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
                                title="Close preview (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Centered High-Res Image Viewport */}
                    <div 
                        className="flex-1 flex items-center justify-center p-4 max-h-[80vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={previewAttachment.url} 
                            alt={previewAttachment.name} 
                            className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                    </div>

                    {/* Bottom Hint */}
                    <div className="text-center text-xs text-white/50 pt-2">
                        Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/80 font-mono">Esc</kbd> or click anywhere to close preview
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskAttachments;
