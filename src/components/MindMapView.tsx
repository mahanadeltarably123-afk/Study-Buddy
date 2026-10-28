
import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { Network, Sparkles, ZoomIn, ZoomOut, RefreshCcw, Download, AlertTriangle, Edit, Save, X, Move, RotateCcw } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface MindMapViewProps {
  summary: string;
  keyPoints: string[];
  existingMap?: string;
  onSaveMap: (map: string) => void;
  t?: any;
}

export const MindMapView: React.FC<MindMapViewProps> = ({ summary, keyPoints, existingMap, onSaveMap, t }) => {
  const [mapData, setMapData] = useState<string | null>(existingMap || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Transform State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState('');

  // Panning State
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({ 
        startOnLoad: true, 
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter',
        flowchart: { curve: 'basis' }
    });
  }, []);

  useEffect(() => {
    if (mapData && !isEditing && containerRef.current) {
      renderMap();
    }
  }, [mapData, isEditing]);

  const renderMap = async () => {
    if (!mapData || !containerRef.current) return;
    try {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Generate unique ID for the SVG
      const id = `mermaid-${Date.now()}`;
      
      // Use mermaid API to render
      const { svg } = await mermaid.render(id, mapData);
      containerRef.current.innerHTML = svg;
      
      // Reset view on new render
      if (!isDragging) {
          // Optional: Center view logic could go here
      }
      setError(null); 
    } catch (err) {
      console.error("Mermaid render error", err);
      setError("Failed to render the visual map structure. The AI generated invalid syntax. Click 'Edit Source' to fix manually.");
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const mermaidCode = await geminiService.generateMindMap(summary, keyPoints);
        setMapData(mermaidCode);
        onSaveMap(mermaidCode);
        if (isEditing) setEditableCode(mermaidCode);
        setPan({ x: 0, y: 0 });
        setScale(1);
    } catch (err) {
        setError("Failed to generate mind map from AI.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownload = () => {
      if (!containerRef.current) return;
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'mindmap.svg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const handleEditToggle = () => {
      if (isEditing) {
          setIsEditing(false);
      } else {
          setEditableCode(mapData || '');
          setIsEditing(true);
      }
  };

  const handleSaveEdit = () => {
      setMapData(editableCode);
      onSaveMap(editableCode);
      setIsEditing(false);
  };

  // --- Panning Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (isEditing) return;
      e.preventDefault(); // Prevent text selection
      setIsDragging(true);
      setStartMouse({ x: e.clientX, y: e.clientY });
      setStartPan({ x: pan.x, y: pan.y });
      document.body.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || isEditing) return;
      e.preventDefault();
      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;
      setPan({ x: startPan.x + dx, y: startPan.y + dy });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
  };

  const handleResetView = () => {
      setPan({ x: 0, y: 0 });
      setScale(1);
  };

  if (!mapData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 group hover:scale-110 transition-transform duration-300">
            <Network className="w-10 h-10 text-white group-hover:rotate-12 transition-transform" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-3">{t?.mindMap || "Mind Map"}</h2>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
          {t?.mapDescription || "Visualise the connections between concepts in this lecture."}
        </p>
        
        <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className="group relative bg-surface border-2 border-primary/20 hover:border-primary text-primary font-bold py-4 px-8 rounded-xl transition-all hover:shadow-xl hover:shadow-primary/10 flex items-center gap-3 overflow-hidden"
        >
            {isLoading ? (
                <>
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    {t?.generatingMap || "Creating visual structure..."}
                </>
            ) : (
                <>
                    <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                    {t?.generateMindMap || "Generate Mind Map"}
                </>
            )}
        </button>
        
        {error && (
            <div className="mt-4 text-red-500 text-sm bg-red-500/10 px-4 py-2 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2 flex-wrap gap-2">
          <h3 className="font-bold text-text flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" /> {t?.mindMap || "Mind Map"}
          </h3>
          
          <div className="flex gap-2 items-center">
             {/* Edit Button */}
             <button 
                onClick={handleEditToggle}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${
                    isEditing 
                    ? 'bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20' 
                    : 'bg-surface text-gray-500 border-gray-700 hover:text-primary hover:border-primary'
                }`}
             >
                 {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit className="w-4 h-4" /> Edit Source</>}
             </button>

             {/* Toolbar */}
             <div className="flex gap-1 bg-surface border border-gray-700 rounded-lg p-1 shadow-sm">
                  <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                  <button onClick={handleResetView} className="px-2 text-xs font-mono text-gray-400 flex items-center select-none w-14 justify-center hover:text-white transition-colors">
                      {Math.round(scale * 100)}%
                  </button>
                  <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                  
                  <div className="w-px bg-gray-700 mx-1 my-1"></div>
                  
                  <button onClick={handleGenerate} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-primary transition-colors" title="Regenerate from AI"><RefreshCcw className="w-4 h-4" /></button>
                  <button onClick={handleDownload} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-green-400 transition-colors" title="Download SVG"><Download className="w-4 h-4" /></button>
             </div>
          </div>
      </div>
      
      <div className="flex-1 bg-white dark:bg-[#0d1117] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative shadow-inner group">
          {isLoading && (
              <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-20 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                      <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm font-medium text-primary">{t?.generatingMap || "Updating..."}</p>
                  </div>
              </div>
          )}

          {/* Error Overlay */}
          {error && !isEditing && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/90 p-6 text-center backdrop-blur-sm">
                <div className="bg-red-500/10 p-4 rounded-full mb-4 animate-bounce">
                   <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-500 mb-2">Rendering Error</h3>
                <p className="text-gray-500 mb-6 max-w-md">{error}</p>
                <div className="flex gap-3">
                    <button onClick={handleGenerate} className="bg-surface border border-gray-300 dark:border-gray-700 text-text px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Try Regenerating
                    </button>
                    <button onClick={handleEditToggle} className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors">
                        Edit Manually
                    </button>
                </div>
             </div>
          )}

          {isEditing ? (
              <div className="absolute inset-0 z-10 bg-surface p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mermaid Syntax Editor</span>
                      <button onClick={handleSaveEdit} className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors">
                          <Save className="w-4 h-4" /> Save & Render
                      </button>
                  </div>
                  <textarea
                      value={editableCode}
                      onChange={(e) => setEditableCode(e.target.value)}
                      className="flex-1 w-full bg-background border border-gray-700 rounded-xl p-4 font-mono text-sm resize-none focus:border-primary focus:outline-none leading-relaxed"
                      spellCheck={false}
                  />
              </div>
          ) : (
            <div 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''} bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMzMzMiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')]`}
            >
                <div 
                    ref={containerRef} 
                    className="origin-center transition-transform duration-75 ease-linear w-full h-full flex items-center justify-center p-20"
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` 
                    }}
                />
            </div>
          )}
          
          {/* Pan Hint */}
          {!isEditing && !error && (
              <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 border border-white/10">
                  <Move className="w-3 h-3" /> Drag to Pan
              </div>
          )}
      </div>
    </div>
  );
};
