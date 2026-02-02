
import React, { useEffect, useRef, useState } from 'react';

interface CameraModuleProps {
  mode: 'PHOTO' | 'AR';
  poiName: string;
  arOverlayUrl?: string; // New optional prop
  onCapture?: (blob: Blob) => void;
}

const CameraModule: React.FC<CameraModuleProps> = ({ mode, poiName, arOverlayUrl, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("L'accès à la caméra a été refusé ou n'est pas disponible.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        if (blob && onCapture) onCapture(blob);
      }, 'image/jpeg');
    }
  };

  if (error) {
    return (
      <div className="bg-stone-100 rounded-[2rem] aspect-[3/4] flex flex-col items-center justify-center p-8 text-center">
        <svg className="w-12 h-12 text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        <p className="text-stone-500 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-[2rem] overflow-hidden aspect-[3/4] shadow-2xl border-4 border-white">
      {/* Flash Effect */}
      {isFlashing && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}
      
      {/* Video Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className={`w-full h-full object-cover ${mode === 'AR' ? 'sepia-[0.4] contrast-[1.1] grayscale-[0.2]' : ''}`}
      />

      {/* AR Overlays */}
      {mode === 'AR' && (
        <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60">
           {arOverlayUrl ? (
             <img src={arOverlayUrl} className="w-full h-full object-cover grayscale brightness-125" alt="AR Overlay" />
           ) : (
             <svg className="w-full h-full text-amber-900/40" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 80 Q 50 70 100 85 V 100 H 0 Z" fill="currentColor" />
                <rect x="20" y="40" width="15" height="40" fill="currentColor" />
                <rect x="65" y="35" width="20" height="45" fill="currentColor" />
             </svg>
           )}
           <div className="absolute top-10 left-10 right-10 border-2 border-amber-500/20 rounded-lg p-2 text-center bg-black/20 backdrop-blur-sm">
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Reconstruction temporelle active</span>
           </div>
        </div>
      )}

      {/* Frame for Photo Mode */}
      {mode === 'PHOTO' && (
        <div className="absolute inset-0 pointer-events-none border-[1.5rem] border-white/10">
           <div className="absolute bottom-4 left-4 right-4 text-center">
              <span className="text-[10px] font-serif font-bold text-white/80 drop-shadow-md">{poiName} • Kairouan Heritage</span>
           </div>
           <svg className="absolute top-4 left-4 w-8 h-8 text-white/40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/></svg>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center">
        <button 
          onClick={takePhoto}
          className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 group"
        >
          <div className="w-12 h-12 rounded-full border-2 border-stone-900 flex items-center justify-center">
            <div className="w-8 h-8 bg-stone-900 rounded-full group-hover:scale-110 transition-transform" />
          </div>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      {/* Recording/Live Indicator */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-[8px] font-black text-white uppercase tracking-widest">{mode === 'AR' ? 'Vision Temporelle' : 'LIVE'}</span>
      </div>
    </div>
  );
};

export default CameraModule;
