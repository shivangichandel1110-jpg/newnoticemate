import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Camera,
  ClipboardPaste,
  Sparkles,
  AlertCircle,
  X,
  FileCheck,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { SAMPLE_NOTICES, SampleNotice } from '../data/sampleNotices';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { optimizeNoticeImage } from '../utils/imageOptimizer';

interface NoticeUploaderProps {
  onAnalyze: (payload: {
    text?: string;
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
    inputMethod: 'file' | 'text' | 'sample';
  }) => Promise<void>;
  isProcessing: boolean;
  processingStage: number; // 1: Reading document, 2: Extracting key details, 3: Preparing summary
  onRetry?: () => void;
  lastErrorMessage?: string | null;
}

export const NoticeUploader: React.FC<NoticeUploaderProps> = ({
  onAnalyze,
  isProcessing,
  processingStage,
  onRetry,
  lastErrorMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [prepStatus, setPrepStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const maxSizeBytes = 25 * 1024 * 1024; // 25 MB

  const validateAndSetFile = (file: File) => {
    setLocalError(null);
    if (!allowedTypes.includes(file.type)) {
      setLocalError(
        'Please upload an official PDF document or an image file (JPG, PNG, WebP). Word documents or spreadsheets are not currently supported.'
      );
      return;
    }
    if (file.size > maxSizeBytes) {
      setLocalError('The file size is larger than 25MB. Please select a smaller file.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setLocalError(null);
    setPrepStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSelectSample = (sample: SampleNotice) => {
    setPastedText(sample.fullText);
    setActiveTab('paste');
    setLocalError(null);
  };

  const handleSubmit = async () => {
    if (isProcessing) return; // Prevent duplicate clicks
    setLocalError(null);
    setPrepStatus(null);

    if (activeTab === 'upload') {
      if (!selectedFile) {
        setLocalError('Please select a PDF document or image file first.');
        return;
      }

      try {
        if (selectedFile.type === 'application/pdf') {
          setPrepStatus('Reading digital PDF text locally...');
          const pdfResult = await extractTextFromPdf(selectedFile);

          if (pdfResult.hasEmbeddedText) {
            setPrepStatus('Extracted embedded text cleanly! Analyzing with Gemini Flash...');
            await onAnalyze({
              text: pdfResult.extractedText,
              fileName: selectedFile.name,
              inputMethod: 'file',
            });
            return;
          }

          // If scanned PDF without embedded text, send base64
          setPrepStatus('Scanned PDF detected. Sending pages for vision analysis...');
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Data = reader.result as string;
            await onAnalyze({
              fileBase64: base64Data,
              mimeType: selectedFile.type,
              fileName: selectedFile.name,
              inputMethod: 'file',
            });
          };
          reader.readAsDataURL(selectedFile);
        } else if (selectedFile.type.startsWith('image/')) {
          setPrepStatus('Optimizing image resolution for fast analysis...');
          const optimized = await optimizeNoticeImage(selectedFile, 1600, 0.85);

          setPrepStatus('Analyzing notice with Gemini Flash...');
          await onAnalyze({
            fileBase64: optimized.base64Data,
            mimeType: optimized.mimeType,
            fileName: selectedFile.name,
            inputMethod: 'file',
          });
        }
      } catch (err: any) {
        setLocalError(err?.message || 'Failed to process document.');
        setPrepStatus(null);
      }
    } else {
      // Paste tab
      const clean = pastedText.trim();
      if (!clean) {
        setLocalError('Please paste the notice text into the box.');
        return;
      }
      if (clean.length < 30) {
        setLocalError('The text is very short. Please paste the full notice for accurate deadline and action extraction.');
        return;
      }

      try {
        await onAnalyze({
          text: clean,
          inputMethod: 'text',
        });
      } catch (err: any) {
        setLocalError(err?.message || 'Failed to process notice text.');
      }
    }
  };

  const displayedError = localError || lastErrorMessage;

  return (
    <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE4E8] shadow-sm p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Welcome copy */}
      <div className="text-center max-w-xl mx-auto mb-7">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8DFF5] text-[#55437a] text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5 text-[#8273B8]" />
          <span>Fast Notice-to-Action Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#373444] tracking-tight mb-2">
          Let&apos;s make your notices easier.
        </h1>
        <p className="text-sm sm:text-base text-[#6F6B78] leading-relaxed">
          Upload a notice, and we&apos;ll help you understand what matters, what to do next, and when to do it.
        </p>
      </div>

      {/* Input Mode Selector Tabs */}
      <div className="flex justify-center mb-6">
        <div
          role="tablist"
          aria-label="Upload notice options"
          className="inline-flex p-1 bg-[#FFF9F2] rounded-2xl border border-[#EAE4E8]"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'upload'}
            disabled={isProcessing}
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#FFFFFF] text-[#373444] shadow-xs'
                : 'text-[#6F6B78] hover:text-[#373444]'
            }`}
          >
            <Upload className="w-4 h-4 text-[#8273B8]" />
            <span>Upload Document</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'paste'}
            disabled={isProcessing}
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-[#FFFFFF] text-[#373444] shadow-xs'
                : 'text-[#6F6B78] hover:text-[#373444]'
            }`}
          >
            <ClipboardPaste className="w-4 h-4 text-[#8273B8]" />
            <span>Paste Text</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'samples'}
            disabled={isProcessing}
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'samples'
                ? 'bg-[#FFFFFF] text-[#373444] shadow-xs'
                : 'text-[#6F6B78] hover:text-[#373444]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#8273B8]" />
            <span>Try Samples</span>
          </button>
        </div>
      </div>

      {/* Error Announcement with Retry */}
      {displayedError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 p-4 bg-[#FCE4E4] border border-[#f5c2c2] text-[#8C2424] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-bold">Processing Error</p>
              <p className="text-xs opacity-90">{displayedError}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => {
                setLocalError(null);
                if (onRetry) onRetry();
                else handleSubmit();
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#8C2424] hover:bg-[#fff0f0] border border-[#f5c2c2] rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => setLocalError(null)}
              className="p-1 text-[#8C2424] hover:opacity-75 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Tab 1: Upload (PDF / Image) */}
      {activeTab === 'upload' && (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all ${
              isDragging
                ? 'border-[#8273B8] bg-[#E8DFF5]/30 scale-[0.99]'
                : selectedFile
                ? 'border-[#DDEBDD] bg-[#DDEBDD]/20'
                : 'border-[#EAE4E8] bg-[#FFF9F2]/60 hover:bg-[#FFF9F2]'
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center">
                {filePreview ? (
                  <div className="relative mb-4">
                    <img
                      src={filePreview}
                      alt="Notice preview"
                      className="max-h-48 rounded-xl object-contain shadow-xs border border-[#EAE4E8]"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-base text-[#373444] max-w-sm truncate">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={clearSelection}
                    disabled={isProcessing}
                    className="p-1 rounded-full text-[#6F6B78] hover:text-red-500 hover:bg-white cursor-pointer"
                    aria-label="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#6F6B78]">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                </p>
                {prepStatus && (
                  <p className="text-xs text-[#8273B8] font-medium mt-2">{prepStatus}</p>
                )}
                <div className="mt-4 flex items-center gap-1.5 text-xs text-[#345334] font-medium bg-[#DDEBDD] px-3 py-1 rounded-full">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Ready to understand</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#E8DFF5] text-[#8273B8] flex items-center justify-center mb-4 shadow-xs">
                  <Upload className="w-8 h-8 stroke-[1.8]" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-[#373444] mb-1">
                  Drag and drop your notice here
                </p>
                <p className="text-xs sm:text-sm text-[#6F6B78] max-w-md mb-5 leading-normal">
                  Upload an official college circular, scholarship notice, fee announcement, or exam schedule.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="notice-file-input"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="notice-file-input"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8273B8] hover:bg-[#7061A6] text-white text-xs sm:text-sm font-semibold rounded-2xl cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Choose a file</span>
                  </label>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                    id="notice-camera-input"
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor="notice-camera-input"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#FFF9F2] text-[#373444] border border-[#EAE4E8] text-xs sm:text-sm font-semibold rounded-2xl cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#8273B8]" />
                    <span>Take photo</span>
                  </label>
                </div>

                <p className="mt-4 text-[11px] text-[#6F6B78]">
                  Supports PDF (fast local text extraction), JPG, PNG &amp; WebP.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Tab 2: Paste Notice Text */}
      {activeTab === 'paste' && (
        <div>
          <label htmlFor="pasted-notice" className="block text-xs font-semibold text-[#373444] uppercase tracking-wide mb-2">
            Paste Notice or Circular Text
          </label>
          <textarea
            id="pasted-notice"
            rows={8}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={isProcessing}
            placeholder="Paste the official notice announcement, circular text, email notification, or WhatsApp circular here..."
            className="w-full p-4 text-sm text-[#373444] bg-[#FFF9F2]/70 border border-[#EAE4E8] rounded-2xl focus-visible:ring-2 focus-visible:ring-[#8273B8] focus:bg-white resize-y"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-[#6F6B78]">
            <span>{pastedText.length} characters</span>
            {pastedText.length > 0 && !isProcessing && (
              <button
                onClick={() => setPastedText('')}
                className="text-xs text-[#8273B8] hover:underline cursor-pointer"
              >
                Clear text
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Tab 3: Test Samples */}
      {activeTab === 'samples' && (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-[#6F6B78] mb-3">
            Select one of these pre-configured test notices to explore the full workflow immediately:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SAMPLE_NOTICES.map((sample) => (
              <div
                key={sample.id}
                className="p-4 rounded-2xl border border-[#EAE4E8] bg-[#FFF9F2]/60 hover:bg-[#FFF9F2] hover:border-[#8273B8] transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block text-[10px] font-semibold uppercase px-2 py-0.5 bg-[#E8DFF5] text-[#4f3d73] rounded-md mb-2">
                    {sample.badge}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-[#373444] mb-1 line-clamp-2">
                    {sample.name}
                  </h3>
                  <p className="text-[11px] text-[#6F6B78] line-clamp-3 mb-3">
                    {sample.description}
                  </p>
                </div>
                <button
                  disabled={isProcessing}
                  onClick={() => handleSelectSample(sample)}
                  className="w-full py-1.5 px-3 bg-white border border-[#8273B8] text-[#8273B8] hover:bg-[#8273B8] hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Load this notice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit / Progress Section */}
      <div className="mt-8 pt-6 border-t border-[#EAE4E8] flex flex-col items-center">
        {isProcessing ? (
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-md bg-[#FFF9F2] border border-[#EAE4E8] rounded-2xl p-5 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#8273B8] animate-ping" />
              <p className="text-sm font-bold text-[#373444]">
                {prepStatus || "We're reading your notice and organizing the important information."}
              </p>
            </div>

            {/* 3 Step progress stages required by user specification */}
            <div className="space-y-2 mt-4 text-xs font-medium text-left">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    processingStage >= 1
                      ? 'bg-[#8273B8] text-white'
                      : 'bg-[#EAE4E8] text-[#6F6B78]'
                  }`}
                >
                  1
                </span>
                <span className={processingStage >= 1 ? 'text-[#373444] font-semibold' : 'text-[#6F6B78]'}>
                  Reading document
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    processingStage >= 2
                      ? 'bg-[#8273B8] text-white'
                      : 'bg-[#EAE4E8] text-[#6F6B78]'
                  }`}
                >
                  2
                </span>
                <span className={processingStage >= 2 ? 'text-[#373444] font-semibold' : 'text-[#6F6B78]'}>
                  Extracting key details
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    processingStage >= 3
                      ? 'bg-[#8273B8] text-white'
                      : 'bg-[#EAE4E8] text-[#6F6B78]'
                  }`}
                >
                  3
                </span>
                <span className={processingStage >= 3 ? 'text-[#373444] font-semibold' : 'text-[#6F6B78]'}>
                  Preparing summary
                </span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-[#8273B8] hover:bg-[#7061A6] text-white text-base font-bold rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition-all disabled:opacity-50"
            aria-label="Understand My Notice"
          >
            <Sparkles className="w-5 h-5" />
            <span>Understand My Notice</span>
          </button>
        )}
      </div>
    </div>
  );
};
