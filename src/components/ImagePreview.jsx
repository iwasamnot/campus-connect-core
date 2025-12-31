import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const ImagePreview = ({ imageUrl, imageName, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // Reset on image change
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, [imageUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale(prev => Math.min(prev + 0.1, 3));
      } else if (e.key === '-') {
        setScale(prev => Math.max(prev - 0.1, 0.5));
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation(prev => (prev + 90) % 360);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Touch/mouse drag handling
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events
  const handleTouchStart = (e) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Pinch zoom for touch devices
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const handleTouchStartPinch = (e) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMovePinch = (e) => {
    if (e.touches.length === 2 && lastTouchDistance) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleChange = distance / lastTouchDistance;
      setScale(prev => Math.max(0.5, Math.min(3, prev * scaleChange)));
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEndPinch = () => {
    setLastTouchDistance(null);
  };

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleTouchStartPinch(e);
      }}
      onTouchMove={(e) => {
        handleTouchMove(e);
        handleTouchMovePinch(e);
      }}
      onTouchEnd={(e) => {
        handleTouchEnd();
        handleTouchEndPinch();
      }}
      style={{
        paddingTop: `env(safe-area-inset-top, 0px)`,
        paddingBottom: `env(safe-area-inset-bottom, 0px)`,
        paddingLeft: `env(safe-area-inset-left, 0px)`,
        paddingRight: `env(safe-area-inset-right, 0px)`
      }}
    >
      {/* Controls */}
      <div
        className="absolute top-4 right-4 flex gap-2 z-10"
        style={{
          top: `calc(1rem + env(safe-area-inset-top, 0px))`,
          right: `calc(1rem + env(safe-area-inset-right, 0px))`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleRotate}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Rotate"
        >
          <RotateCw size={20} />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Reset"
        >
          <span className="text-sm font-medium">Reset</span>
        </button>
        <button
          onClick={handleDownload}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Download"
        >
          <Download size={20} />
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image */}
      <div
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageUrl}
          alt={imageName || 'Preview'}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Image name */}
      {imageName && (
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 text-white rounded-lg backdrop-blur-sm text-sm"
          style={{
            bottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {imageName}
        </div>
      )}

      {/* Zoom indicator */}
      {scale !== 1 && (
        <div
          className="absolute top-4 left-4 px-3 py-1 bg-white/10 text-white rounded-lg backdrop-blur-sm text-sm"
          style={{
            top: `calc(1rem + env(safe-area-inset-top, 0px))`,
            left: `calc(1rem + env(safe-area-inset-left, 0px))`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
};

export default ImagePreview;

