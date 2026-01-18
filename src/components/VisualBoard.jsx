/**
 * Visual Collaboration Board Component (Miro-like)
 * Real-time collaborative whiteboard for brainstorming, flowcharts, and visual design
 * v14.0.0 Feature
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square, Circle, Triangle, ArrowRight, Type, StickyNote, 
  Move, PenTool, Eraser, ZoomIn, ZoomOut, Download, 
  Upload, Trash2, Undo, Redo, Users, X, Minus, Plus,
  Workflow, Brain, Layers, Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot, 
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
// Use window.__firebaseDb to avoid import/export issues
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;

const VisualBoard = ({ onClose, boardId = null }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [currentBoardId, setCurrentBoardId] = useState(boardId || `board_${Date.now()}_${user?.uid}`);
  const [tool, setTool] = useState('select'); // select, pen, text, shape, connector, sticky
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPath, setDrawPath] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [shapeType, setShapeType] = useState('rectangle'); // rectangle, circle, triangle, arrow
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#3B82F6'); // indigo
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [collaborators, setCollaborators] = useState({}); // { userId: { cursor, name, color } }
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const isLocalUpdate = useRef(false); // Prevent update loops
  const debounceTimer = useRef(null);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#000000'
  ];

  // Save to history
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(shapes));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [shapes, history, historyIndex]);

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevShapes = JSON.parse(history[historyIndex - 1]);
      setShapes(prevShapes);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextShapes = JSON.parse(history[historyIndex + 1]);
      setShapes(nextShapes);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  // Handle mouse down
  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (tool === 'select') {
      // Check if clicking on a shape
      const clickedShape = [...shapes].reverse().find(s => {
        if (s.type === 'text' || s.type === 'sticky') {
          return pos.x >= s.x && pos.x <= s.x + (s.width || 100) && 
                 pos.y >= s.y && pos.y <= s.y + (s.height || 30);
        }
        // Simple hit test for shapes
        return Math.abs(pos.x - (s.x + (s.width || 0) / 2)) < Math.abs(s.width || 50) / 2 && 
               Math.abs(pos.y - (s.y + (s.height || 0) / 2)) < Math.abs(s.height || 50) / 2;
      });
      
      if (clickedShape) {
        setSelectedShape(clickedShape.id);
      } else {
        setSelectedShape(null);
      }
      
      // Start panning with space or middle mouse
      if (e.button === 1 || e.shiftKey) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    } else if (tool === 'pen') {
      setIsDrawing(true);
      setDrawPath([pos]);
    } else if (tool === 'text') {
      setTextPosition(pos);
      setShowTextInput(true);
    } else if (tool === 'shape') {
      const newShape = {
        id: Date.now(),
        type: shapeType,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color,
        strokeWidth
      };
      setShapes([...shapes, newShape]);
      setSelectedShape(newShape.id);
    } else if (tool === 'sticky') {
      const newSticky = {
        id: Date.now(),
        type: 'sticky',
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 150,
        text: 'New note',
        color: '#FEF08A'
      };
      setShapes([...shapes, newSticky]);
      setSelectedShape(newSticky.id);
      saveToHistory();
    }
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (isDrawing && tool === 'pen') {
      const pos = getMousePos(e);
      setDrawPath([...drawPath, pos]);
    } else if (tool === 'shape' && selectedShape) {
      const pos = getMousePos(e);
      setShapes(shapes.map(s => 
        s.id === selectedShape
          ? { ...s, width: pos.x - s.x, height: pos.y - s.y }
          : s
      ));
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (isDrawing && tool === 'pen' && drawPath.length > 0) {
      const newPath = {
        id: Date.now(),
        type: 'path',
        points: drawPath,
        color,
        strokeWidth
      };
      setShapes([...shapes, newPath]);
      setDrawPath([]);
      saveToHistory();
    }
    setIsDrawing(false);
  };

  // Handle text input
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const newText = {
        id: Date.now(),
        type: 'text',
        x: textPosition.x,
        y: textPosition.y,
        text: textInput,
        color,
        fontSize: 16
      };
      setShapes([...shapes, newText]);
      saveToHistory();
    }
    setTextInput('');
    setShowTextInput(false);
  };

  // Delete selected shape
  const handleDelete = () => {
    if (selectedShape) {
      setShapes(shapes.filter(s => s.id !== selectedShape));
      setSelectedShape(null);
      saveToHistory();
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export canvas
  const handleExport = () => {
    // In a real implementation, you'd render to canvas and export as image
    success('Export feature coming soon!');
  };

  // Draw shape
  const drawShape = (ctx, shape) => {
    ctx.strokeStyle = shape.color || color;
    ctx.fillStyle = shape.fillColor || 'transparent';
    ctx.lineWidth = shape.strokeWidth || strokeWidth;
    
    ctx.beginPath();
    
    switch (shape.type) {
      case 'rectangle':
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        break;
      case 'circle':
        const radius = Math.min(Math.abs(shape.width), Math.abs(shape.height)) / 2;
        ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, radius, 0, Math.PI * 2);
        break;
      case 'triangle':
        ctx.moveTo(shape.x + shape.width / 2, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.lineTo(shape.x, shape.y + shape.height);
        ctx.closePath();
        break;
      case 'arrow':
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.moveTo(shape.x + shape.width - 10, shape.y + shape.height - 10);
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
        ctx.lineTo(shape.x + shape.width - 10, shape.y + shape.height + 10);
        break;
      case 'path':
        if (shape.points && shape.points.length > 0) {
          ctx.moveTo(shape.points[0].x, shape.points[0].y);
          shape.points.forEach(point => ctx.lineTo(point.x, point.y));
        }
        break;
    }
    
    ctx.stroke();
    if (shape.fillColor) ctx.fill();
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw grid
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x < canvas.width / zoom; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / zoom);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height / zoom; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / zoom, y);
      ctx.stroke();
    }
    
    // Draw shapes
    shapes.forEach(shape => {
      if (shape.type === 'text') {
        ctx.fillStyle = shape.color || color;
        ctx.font = `${shape.fontSize || 16}px sans-serif`;
        ctx.fillText(shape.text, shape.x, shape.y);
      } else if (shape.type === 'sticky') {
        ctx.fillStyle = shape.color || '#FEF08A';
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';
        ctx.fillText(shape.text, shape.x + 10, shape.y + 20);
      } else {
        drawShape(ctx, shape);
      }
      
      // Draw selection
      if (selectedShape === shape.id) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(shape.x - 5, shape.y - 5, 
          (shape.width || 100) + 10, (shape.height || 100) + 10);
        ctx.setLineDash([]);
      }
    });
    
    // Draw current path
    if (isDrawing && drawPath.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(drawPath[0].x, drawPath[0].y);
      drawPath.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }
    
    ctx.restore();
  }, [shapes, selectedShape, isDrawing, drawPath, zoom, pan, color, strokeWidth]);

  // Update canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return (
    <div className="h-full min-h-0 flex flex-col bg-transparent relative overflow-hidden">
      {/* Toolbar */}
      <div className="glass-panel border-b border-white/10 px-4 py-3 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Tools */}
          <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
            {[
              { id: 'select', icon: Move, label: 'Select' },
              { id: 'pen', icon: PenTool, label: 'Pen' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'shape', icon: Square, label: 'Shape' },
              { id: 'sticky', icon: StickyNote, label: 'Sticky Note' }
            ].map(t => (
              <motion.button
                key={t.id}
                onClick={() => setTool(t.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-all ${
                  tool === t.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title={t.label}
              >
                <t.icon size={18} />
              </motion.button>
            ))}
          </div>

          {/* Shape selector */}
          {tool === 'shape' && (
            <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
              {[
                { id: 'rectangle', icon: Square },
                { id: 'circle', icon: Circle },
                { id: 'triangle', icon: Triangle },
                { id: 'arrow', icon: ArrowRight }
              ].map(s => (
                <motion.button
                  key={s.id}
                  onClick={() => setShapeType(s.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-lg transition-all ${
                    shapeType === s.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <s.icon size={18} />
                </motion.button>
              ))}
            </div>
          )}

          {/* Colors */}
          <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded transition-all ${
                  color === c ? 'ring-2 ring-white' : ''
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          {/* Stroke width */}
          <div className="flex items-center gap-2 glass-panel border border-white/10 rounded-xl px-3 py-1">
            <Minus size={14} className="text-white/60" />
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
            <Plus size={14} className="text-white/60" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History */}
          <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo size={18} />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="px-2 text-sm text-white/70">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleZoomReset}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Reset Zoom"
            >
              <span className="text-xs">1:1</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
            <button
              onClick={handleDelete}
              disabled={!selectedShape}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Export"
            >
              <Download size={18} />
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden min-h-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          style={{ background: '#111827' }}
        />
        
        {/* Text Input Overlay */}
        <AnimatePresence>
          {showTextInput && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'absolute',
                left: `${textPosition.x * zoom + pan.x}px`,
                top: `${textPosition.y * zoom + pan.y}px`,
                transform: 'scale(' + zoom + ')',
                transformOrigin: 'top left'
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit();
                  } else if (e.key === 'Escape') {
                    setShowTextInput(false);
                    setTextInput('');
                  }
                }}
                onBlur={handleTextSubmit}
                autoFocus
                className="px-3 py-1 bg-white text-black rounded border-2 border-indigo-500 focus:outline-none"
                style={{ fontSize: '16px' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collaborator Cursors Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {Object.entries(collaborators).map(([userId, collaborator]) => (
          <motion.div
            key={userId}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              left: `${collaborator.cursor.x * zoom + pan.x}px`,
              top: `${collaborator.cursor.y * zoom + pan.y}px`
            }}
            className="absolute pointer-events-none"
            style={{ 
              transform: 'translate(-50%, -50%) scale(' + zoom + ')',
              transformOrigin: 'center'
            }}
          >
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: collaborator.color }}
            />
            <div 
              className="absolute top-5 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.name}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info Bar */}
      <div className="glass-panel border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-4">
          <span>Shapes: {shapes.length}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Tool: {tool}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} />
          <span>
            {Object.keys(collaborators).length > 0 
              ? `${Object.keys(collaborators).length + 1} collaborating`
              : '1 user'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VisualBoard;
