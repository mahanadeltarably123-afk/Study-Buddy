
import React, { useCallback, useEffect, useState } from 'react';
import { Upload, FileAudio, FileVideo, Database, FileText, BrainCircuit, Cpu, CheckCircle2 } from 'lucide-react';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  progressStep?: number;
  t?: any; // Added translation prop
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelect, isProcessing, progressStep = 0, t }) => {
  // Define steps inside component to access 't'
  const PROCESSING_STEPS = [
    { icon: FileAudio, text: t?.stepIngest || "Ingesting lecture data...", subtext: t?.subIngest || "Extracting audio track" },
    { icon: FileText, text: t?.stepChunk || "Chunking content...", subtext: t?.subChunk || "Splitting into semantic segments" },
    { icon: Cpu, text: t?.stepEmbed || "Generating embeddings...", subtext: t?.subEmbed || "Vectorizing content via Gemini" },
    { icon: Database, text: t?.stepIndex || "Indexing vector store...", subtext: t?.subIndex || "Optimizing for retrieval" },
    { icon: BrainCircuit, text: t?.stepRag || "Finalizing RAG system...", subtext: t?.subRag || "Preparing study agents" }
  ];

  // Internal state for smooth fallback if not controlled
  const [internalStep, setInternalStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // If we rely on internal timer when component is mounted (fallback)
  useEffect(() => {
      if (isProcessing && progressStep === undefined) {
        const interval = setInterval(() => {
            setInternalStep(prev => (prev + 1) % PROCESSING_STEPS.length);
        }, 2000);
        return () => clearInterval(interval);
      }
  }, [isProcessing, progressStep]);
  
  // Use passed prop if available, else internal
  const activeStep = progressStep !== undefined ? progressStep : internalStep;

  const handleDragEnter = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-blue-400 to-accent bg-clip-text text-transparent mb-6 tracking-tight">
          {t?.appName || "Study Buddy"} RAG System
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          {t?.heroSubtitle || "Upload your lecture to initialize the Retrieval Augmented Generation pipeline."}
        </p>
      </div>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full aspect-[2.5/1] rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden group
          ${isProcessing 
            ? 'border-primary/50 bg-surface/30 cursor-wait' 
            : isDragging
                ? 'border-primary bg-primary/10 scale-[1.02] shadow-xl shadow-primary/10'
                : 'border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-surface/50 bg-surface/20'
          }
        `}
      >
        {!isProcessing && (
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
        )}

        <div className="z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
          {isProcessing ? (
            <div className="w-full max-w-lg px-8">
              {/* RAG Pipeline Visualization */}
              <div className="flex justify-between mb-12 relative">
                 {/* Connecting Line */}
                 <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -z-10 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-500 ease-linear" 
                        style={{ width: `${((activeStep) / (PROCESSING_STEPS.length - 1)) * 100}%` }}
                    />
                 </div>

                 {PROCESSING_STEPS.map((step, idx) => {
                     const isActive = idx === activeStep;
                     const isCompleted = idx < activeStep;
                     const Icon = step.icon;
                     
                     return (
                         <div key={idx} className="relative flex flex-col items-center group">
                             <div className={`
                                 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-surface
                                 ${isActive || isCompleted ? 'border-primary text-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-gray-300 dark:border-gray-700 text-gray-400'}
                             `}>
                                 {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                             </div>
                         </div>
                     )
                 })}
              </div>
              
              <div className="text-center space-y-2 animate-fade-in h-16">
                  <h3 className="text-xl font-bold text-text">{PROCESSING_STEPS[activeStep % PROCESSING_STEPS.length].text}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{PROCESSING_STEPS[activeStep % PROCESSING_STEPS.length].subtext}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center transition-transform duration-300">
              <div className={`
                  w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-colors ring-1 ring-black/5 dark:ring-white/10
                  ${isDragging ? 'bg-primary text-white ring-primary' : 'bg-gray-200 dark:bg-gray-800/50 text-gray-400 group-hover:bg-primary/20 group-hover:text-primary group-hover:ring-primary/50'}
              `}>
                <Upload className="w-8 h-8" />
              </div>
              <h3 className={`text-2xl font-semibold mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-text'}`}>
                {isDragging ? t?.dropToUpload || 'Drop to Upload' : t?.uploadLectureRec || 'Upload Lecture Recording'}
              </h3>
              <div className="flex gap-4 text-sm text-gray-500 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full border border-gray-200 dark:border-white/5">
                <span className="flex items-center gap-2"><FileAudio className="w-4 h-4 text-accent" /> MP3, WAV</span>
                <span className="w-px h-4 bg-gray-400 dark:bg-gray-700"></span>
                <span className="flex items-center gap-2"><FileVideo className="w-4 h-4 text-blue-400" /> MP4, MOV</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
         <FeatureCard 
           icon={<Database className="w-6 h-6 text-blue-400" />}
           title="Vector Store" 
           desc="Semantic context embedding" 
         />
         <FeatureCard 
           icon={<BrainCircuit className="w-6 h-6 text-purple-400" />}
           title="RAG Inference" 
           desc="Grounded QA generation" 
         />
         <FeatureCard 
           icon={<FileText className="w-6 h-6 text-emerald-400" />}
           title="Auto-Notes" 
           desc="Structured study output" 
         />
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="bg-surface/40 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-primary/30 transition-all group shadow-sm">
    <div className="mb-4 p-3 bg-gray-100 dark:bg-black/20 rounded-xl w-fit group-hover:scale-110 transition-transform">{icon}</div>
    <h4 className="font-bold text-text text-lg mb-1">{title}</h4>
    <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
  </div>
);
