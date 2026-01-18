/**
 * Visual Collaboration Board Component (Miro-like)
 * Real-time collaborative whiteboard for brainstorming, flowcharts, and visual design
 * v14.0.0 Feature
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square, Circle, Triangle, ArrowRight, Type, StickyNote, 
  Move, PenTool, Eraser, ZoomIn, ZoomOut, Download, 
  Upload, Trash2, Undo, Redo, Users, X, Minus, Plus,
  Workflow, Brain, Grid3x3, Link as LinkIcon, FileText, Save,
  Palette, AlignLeft, AlignCenter, AlignRight, ArrowUp, ArrowDown,
  Lock, Unlock, Copy, Scissors, Maximize2, Minimize2, Grid,
  Hexagon, Diamond, Image as ImageIcon, Bold, Italic, Maximize,
  MoreVertical, GitBranch, ArrowUpCircle, ArrowDownCircle, RotateCw,
  Box, Boxes, Check, Loader, Search, Zap
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
  arrayRemove,
  query,
  where,
  orderBy,
  limit
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
  const [boardBackground, setBoardBackground] = useState('#111827'); // Board background color
  const [boards, setBoards] = useState([]); // List of boards
  const [showBoardManager, setShowBoardManager] = useState(false); // Board selection modal
  const [connectorStart, setConnectorStart] = useState(null); // For connector tool
  const [editingText, setEditingText] = useState(null); // Currently editing text shape
  const [showColorPicker, setShowColorPicker] = useState(false); // Show background color picker
  const [selectedShapes, setSelectedShapes] = useState(new Set()); // Multi-select
  const [isSelecting, setIsSelecting] = useState(false); // Selection box
  const [selectionBox, setSelectionBox] = useState(null); // { x, y, width, height }
  const [copiedShapes, setCopiedShapes] = useState([]); // Clipboard
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false); // Properties panel
  const [dragStart, setDragStart] = useState(null); // For dragging shapes
  const [resizingHandle, setResizingHandle] = useState(null); // Resize handle being dragged
  const [groups, setGroups] = useState({}); // { groupId: [shapeIds] }
  const [showMinimap, setShowMinimap] = useState(true); // Show minimap
  const [textFormatting, setTextFormatting] = useState({ bold: false, italic: false, fontSize: 16 }); // Text formatting
  const [snapToGrid, setSnapToGrid] = useState(false); // Snap to grid
  const [saving, setSaving] = useState(false); // Auto-save indicator
  const [lockedShapes, setLockedShapes] = useState(new Set()); // Locked shapes
  const [imageCache, setImageCache] = useState({}); // Cache loaded images
  const fileInputRef = useRef(null); // File input for image upload
  const isLocalUpdate = useRef(false); // Prevent update loops
  const debounceTimer = useRef(null);
  const imagesLoadedRef = useRef({}); // Track loaded images for canvas

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#000000'
  ];

  const boardColors = [
    { name: 'Dark', value: '#111827' },
    { name: 'Light Gray', value: '#F3F4F6' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Blue', value: '#1E40AF' },
    { name: 'Green', value: '#065F46' },
    { name: 'Purple', value: '#581C87' },
    { name: 'Pink', value: '#9F1239' }
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

  // Get mouse position relative to canvas (works with event or {clientX, clientY} object)
  const getMousePos = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = e.clientX || e.x || 0;
    const clientY = e.clientY || e.y || 0;
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom
    };
  };

  // Handle mouse down
  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
      if (tool === 'select') {
      // Check if clicking on a shape (from top to bottom, topmost selected first)
      const clickedShape = [...shapes].reverse().find(s => {
        // Skip locked shapes during selection (but allow clicking to see it's locked)
        if (lockedShapes.has(s.id) && tool !== 'connector') return false;
        
        if (s.type === 'text') {
          // Better text hit test - approximate text width
          const text = s.text || '';
          const fontSize = s.fontSize || 16;
          const textWidth = text.length * fontSize * 0.6; // Approximate character width
          const textHeight = fontSize;
          return pos.x >= s.x && pos.x <= s.x + textWidth && 
                 pos.y >= s.y && pos.y <= s.y + textHeight;
        } else if (s.type === 'sticky') {
          return pos.x >= s.x && pos.x <= s.x + (s.width || 200) && 
                 pos.y >= s.y && pos.y <= s.y + (s.height || 150);
        } else if (s.type === 'image') {
          return pos.x >= s.x && pos.x <= s.x + (s.width || 200) && 
                 pos.y >= s.y && pos.y <= s.y + (s.height || 150);
        } else if (s.type === 'path') {
          // Check if click is near any point in path (within 10px)
          if (s.points && s.points.length > 0) {
            return s.points.some(point => 
              Math.abs(pos.x - point.x) < 10 && Math.abs(pos.y - point.y) < 10
            );
          }
          return false;
        } else {
          // Better hit test for shapes - use bounding box
          const width = Math.abs(s.width || 50);
          const height = Math.abs(s.height || 50);
          return pos.x >= s.x && pos.x <= s.x + width && 
                 pos.y >= s.y && pos.y <= s.y + height;
        }
      });
      
      if (clickedShape) {
        // Multi-select with Shift
        if (e.shiftKey) {
          const newSelection = new Set(selectedShapes);
          if (newSelection.has(clickedShape.id)) {
            newSelection.delete(clickedShape.id);
            if (newSelection.size === 0) setSelectedShape(null);
          } else {
            newSelection.add(clickedShape.id);
          }
          setSelectedShapes(newSelection);
          setSelectedShape(clickedShape.id);
        } else {
          setSelectedShape(clickedShape.id);
          setSelectedShapes(new Set([clickedShape.id]));
        }
        // Double-click to edit text/sticky
        if (e.detail === 2 && (clickedShape.type === 'text' || clickedShape.type === 'sticky')) {
          setEditingText(clickedShape.id);
          setTextInput(clickedShape.text || '');
          setTextPosition({ x: clickedShape.x, y: clickedShape.y });
          setShowTextInput(true);
        }
        // Start dragging - store click position and shape position for proper offset calculation
        setDragStart({ 
          clickX: pos.x, 
          clickY: pos.y,
          shapeX: clickedShape.x, 
          shapeY: clickedShape.y 
        });
      } else {
        // Clicked on empty space - start selection box if not shift
        if (!e.shiftKey && e.button === 0) {
          setSelectedShape(null);
          setSelectedShapes(new Set());
          setIsSelecting(true);
          setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
        }
      }
      
      // Start panning with middle mouse button (not shift + left click)
      if (e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    } else if (tool === 'pen') {
      setIsDrawing(true);
      setDrawPath([pos]);
    } else if (tool === 'text') {
      setTextPosition(pos);
      setTextInput('');
      setShowTextInput(true);
    } else if (tool === 'connector') {
      // Find shape at click position
      const clickedShape = [...shapes].reverse().find(s => {
        const centerX = s.x + (s.width || 0) / 2;
        const centerY = s.y + (s.height || 0) / 2;
        return Math.abs(pos.x - centerX) < 30 && Math.abs(pos.y - centerY) < 30;
      });
      
      if (clickedShape) {
        if (!connectorStart) {
          // Start connector
          const centerX = clickedShape.x + (clickedShape.width || 0) / 2;
          const centerY = clickedShape.y + (clickedShape.height || 0) / 2;
          setConnectorStart({ shapeId: clickedShape.id, x: centerX, y: centerY });
        } else {
          // Complete connector
          const centerX = clickedShape.x + (clickedShape.width || 0) / 2;
          const centerY = clickedShape.y + (clickedShape.height || 0) / 2;
          const newConnector = {
            id: Date.now(),
            type: 'connector',
            fromShapeId: connectorStart.shapeId,
            toShapeId: clickedShape.id,
            fromX: connectorStart.x,
            fromY: connectorStart.y,
            toX: centerX,
            toY: centerY,
            color: '#666',
            strokeWidth: 2
          };
          setShapes([...shapes, newConnector]);
          setConnectorStart(null);
          saveToHistory();
        }
      }
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
    const pos = getMousePos(e);
    setCursorPosition(pos); // Always update cursor for connector preview
    
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (isSelecting && tool === 'select') {
      // Update selection box
      const startX = selectionBox?.x || pos.x;
      const startY = selectionBox?.y || pos.y;
      setSelectionBox({
        x: Math.min(startX, pos.x),
        y: Math.min(startY, pos.y),
        width: Math.abs(pos.x - startX),
        height: Math.abs(pos.y - startY)
      });
    } else if (isDrawing && tool === 'pen') {
      setDrawPath([...drawPath, pos]);
    } else if (tool === 'shape' && selectedShape) {
      const shape = shapes.find(s => s.id === selectedShape);
      if (shape) {
        const newWidth = pos.x - shape.x;
        const newHeight = pos.y - shape.y;
        setShapes(shapes.map(s => 
          s.id === selectedShape
            ? { ...s, width: newWidth, height: newHeight }
            : s
        ));
      }
    } else if (tool === 'connector' && connectorStart) {
      // Cursor position already updated above
    } else if (tool === 'select' && dragStart && (selectedShape || selectedShapes.size > 0)) {
      // Drag selected shape(s) - use proper offset calculation
      if (!dragStart.shapeX || !dragStart.shapeY) return; // Guard against invalid dragStart
      
      const deltaX = pos.x - dragStart.clickX;
      const deltaY = pos.y - dragStart.clickY;
      
      const shapeIds = selectedShapes.size > 0 
        ? Array.from(selectedShapes)
        : [selectedShape].filter(Boolean);
      
      setShapes(shapes.map(s => {
        if (!shapeIds.includes(s.id) || lockedShapes.has(s.id)) return s;
        
        let newX = s.x + deltaX;
        let newY = s.y + deltaY;
        
        // Apply snap to grid if enabled
        if (snapToGrid) {
          const snap = 20;
          newX = Math.round(newX / snap) * snap;
          newY = Math.round(newY / snap) * snap;
        }
        
        return { ...s, x: newX, y: newY };
      }));
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    // Finalize selection box
    if (isSelecting && selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      const selectedIds = new Set();
      shapes.forEach(shape => {
        if (lockedShapes.has(shape.id)) return;
        const shapeLeft = shape.x;
        const shapeRight = shape.x + (shape.width || 100);
        const shapeTop = shape.y;
        const shapeBottom = shape.y + (shape.height || 100);
        
        const boxLeft = Math.min(selectionBox.x, selectionBox.x + selectionBox.width);
        const boxRight = Math.max(selectionBox.x, selectionBox.x + selectionBox.width);
        const boxTop = Math.min(selectionBox.y, selectionBox.y + selectionBox.height);
        const boxBottom = Math.max(selectionBox.y, selectionBox.y + selectionBox.height);
        
        // Check if shape overlaps with selection box
        if (shapeRight > boxLeft && shapeLeft < boxRight && shapeBottom > boxTop && shapeTop < boxBottom) {
          selectedIds.add(shape.id);
        }
      });
      
      if (selectedIds.size > 0) {
        setSelectedShapes(selectedIds);
        setSelectedShape(Array.from(selectedIds)[0]);
      }
      setSelectionBox(null);
    }
    
    if (isDrawing && tool === 'pen' && drawPath.length > 1) {
      const newPath = {
        id: Date.now(),
        type: 'path',
        points: [...drawPath],
        color,
        strokeWidth
      };
      setShapes([...shapes, newPath]);
      setDrawPath([]);
      saveToHistory();
    } else if (tool === 'shape' && selectedShape) {
      // Finalize shape on mouse up
      saveToHistory();
    }
    
    setIsDrawing(false);
    setIsPanning(false);
    setIsSelecting(false);
    setDragStart(null);
    setResizingHandle(null);
  };

  // Handle text input
  const handleTextSubmit = () => {
    if (editingText) {
      // Update existing text
      setShapes(shapes.map(s => 
        s.id === editingText 
          ? { ...s, text: textInput.trim() || s.text }
          : s
      ));
      setEditingText(null);
      saveToHistory();
    } else if (textInput.trim()) {
      // Create new text
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

  // Delete selected shape(s)
  const handleDelete = () => {
    if (selectedShapes.size > 0) {
      // Multi-delete
      setShapes(shapes.filter(s => !selectedShapes.has(s.id)));
      setSelectedShapes(new Set());
      setSelectedShape(null);
      saveToHistory();
    } else if (selectedShape) {
      // Single delete
      setShapes(shapes.filter(s => s.id !== selectedShape));
      setSelectedShape(null);
      saveToHistory();
    }
  };

  // Copy selected shapes
  const handleCopy = useCallback(() => {
    const shapesToCopy = selectedShapes.size > 0
      ? shapes.filter(s => selectedShapes.has(s.id))
      : selectedShape ? shapes.filter(s => s.id === selectedShape) : [];
    
    if (shapesToCopy.length > 0) {
      setCopiedShapes(shapesToCopy.map(s => ({ ...s, id: undefined })));
      success(`Copied ${shapesToCopy.length} shape(s)`);
    }
  }, [selectedShapes, selectedShape, shapes, success]);

  // Paste copied shapes
  const handlePaste = useCallback(() => {
    if (copiedShapes.length === 0) return;
    
    const offset = 20; // Offset for pasted shapes
    const newShapes = copiedShapes.map((shape, idx) => ({
      ...shape,
      id: Date.now() + idx,
      x: (shape.x || 0) + offset,
      y: (shape.y || 0) + offset
    }));
    
    setShapes([...shapes, ...newShapes]);
    setSelectedShapes(new Set(newShapes.map(s => s.id)));
    saveToHistory();
    success(`Pasted ${newShapes.length} shape(s)`);
  }, [copiedShapes, shapes, saveToHistory, success]);

  // Align shapes
  const handleAlign = (direction) => {
    const shapesToAlign = selectedShapes.size > 0
      ? shapes.filter(s => selectedShapes.has(s.id))
      : selectedShape ? shapes.filter(s => s.id === selectedShape) : [];
    
    if (shapesToAlign.length < 2) return;

    const bounds = shapesToAlign.reduce((acc, s) => {
      const left = s.x;
      const right = s.x + (s.width || 0);
      const top = s.y;
      const bottom = s.y + (s.height || 0);
      return {
        left: Math.min(acc.left, left),
        right: Math.max(acc.right, right),
        top: Math.min(acc.top, top),
        bottom: Math.max(acc.bottom, bottom)
      };
    }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

    const updatedShapes = shapes.map(s => {
      if (!shapesToAlign.some(align => align.id === s.id)) return s;
      
      let newX = s.x, newY = s.y;
      
      switch (direction) {
        case 'left': newX = bounds.left; break;
        case 'right': newX = bounds.right - (s.width || 0); break;
        case 'center': newX = (bounds.left + bounds.right) / 2 - (s.width || 0) / 2; break;
        case 'top': newY = bounds.top; break;
        case 'bottom': newY = bounds.bottom - (s.height || 0); break;
        case 'middle': newY = (bounds.top + bounds.bottom) / 2 - (s.height || 0) / 2; break;
      }
      
      return { ...s, x: newX, y: newY };
    });

    setShapes(updatedShapes);
    saveToHistory();
    success(`Aligned ${shapesToAlign.length} shape(s) ${direction}`);
  };

  // Export to PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      success('Board exported as PNG!');
    }, 'image/png');
  };

  // Export to SVG
  const handleExportSVG = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '2000');
    svg.setAttribute('height', '2000');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Add background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', boardBackground);
    svg.appendChild(rect);
    
    // Add shapes
    shapes.forEach(shape => {
      if (shape.type === 'text') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', shape.x);
        text.setAttribute('y', shape.y);
        text.setAttribute('fill', shape.color || color);
        text.setAttribute('font-size', shape.fontSize || 16);
        text.textContent = shape.text || '';
        svg.appendChild(text);
      } else if (shape.type === 'rectangle') {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', shape.x);
        rect.setAttribute('y', shape.y);
        rect.setAttribute('width', shape.width);
        rect.setAttribute('height', shape.height);
        rect.setAttribute('stroke', shape.color || color);
        rect.setAttribute('fill', 'transparent');
        rect.setAttribute('stroke-width', shape.strokeWidth || strokeWidth);
        svg.appendChild(rect);
      } else if (shape.type === 'circle') {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const radius = Math.min(Math.abs(shape.width), Math.abs(shape.height)) / 2;
        circle.setAttribute('cx', shape.x + shape.width / 2);
        circle.setAttribute('cy', shape.y + shape.height / 2);
        circle.setAttribute('r', radius);
        circle.setAttribute('stroke', shape.color || color);
        circle.setAttribute('fill', 'transparent');
        circle.setAttribute('stroke-width', shape.strokeWidth || strokeWidth);
        svg.appendChild(circle);
      }
    });
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    success('Board exported as SVG!');
  };

  // Upload image to board
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
      setSaving(true);
      const { uploadImage } = await import('../utils/storageService');
      const result = await uploadImage(file, 'visual-boards', {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 'auto'
      });
      
      // Create image shape at center of view
      const rect = containerRef.current?.getBoundingClientRect();
      const centerX = rect ? (rect.width / 2 - pan.x) / zoom : 500;
      const centerY = rect ? (rect.height / 2 - pan.y) / zoom : 500;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const newImageShape = {
          id: Date.now(),
          type: 'image',
          x: centerX - img.width / 2,
          y: centerY - img.height / 2,
          width: Math.min(img.width, 400),
          height: Math.min(img.height, 400) * (img.height / img.width),
          url: result.url,
          src: result.url
        };
        setShapes([...shapes, newImageShape]);
        saveToHistory();
        success('Image added to board!');
        setSaving(false);
      };
      img.onerror = () => {
        showError('Failed to load image');
        setSaving(false);
      };
      img.src = result.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Failed to upload image');
      setSaving(false);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Duplicate selected shapes
  const handleDuplicate = () => {
    const shapesToDuplicate = selectedShapes.size > 0
      ? shapes.filter(s => selectedShapes.has(s.id))
      : selectedShape ? shapes.filter(s => s.id === selectedShape) : [];
    
    if (shapesToDuplicate.length === 0) return;
    
    const offset = 30; // Offset for duplicated shapes
    const newShapes = shapesToDuplicate.map((shape, idx) => ({
      ...shape,
      id: Date.now() + idx,
      x: (shape.x || 0) + offset,
      y: (shape.y || 0) + offset
    }));
    
    setShapes([...shapes, ...newShapes]);
    setSelectedShapes(new Set(newShapes.map(s => s.id)));
    setSelectedShape(newShapes[0]?.id || null);
    saveToHistory();
    success(`Duplicated ${newShapes.length} shape(s)`);
  };

  // Layer management - Bring to front
  const handleBringToFront = () => {
    if (!selectedShape) return;
    
    const shape = shapes.find(s => s.id === selectedShape);
    if (!shape) return;
    
    const otherShapes = shapes.filter(s => s.id !== selectedShape);
    setShapes([...otherShapes, shape]);
    saveToHistory();
    success('Shape brought to front');
  };

  // Layer management - Send to back
  const handleSendToBack = () => {
    if (!selectedShape) return;
    
    const shape = shapes.find(s => s.id === selectedShape);
    if (!shape) return;
    
    const otherShapes = shapes.filter(s => s.id !== selectedShape);
    setShapes([shape, ...otherShapes]);
    saveToHistory();
    success('Shape sent to back');
  };

  // Toggle lock on selected shape
  const handleToggleLock = () => {
    if (!selectedShape) return;
    
    const newLocked = new Set(lockedShapes);
    if (newLocked.has(selectedShape)) {
      newLocked.delete(selectedShape);
      success('Shape unlocked');
    } else {
      newLocked.add(selectedShape);
      success('Shape locked');
    }
    setLockedShapes(newLocked);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export canvas - now uses PNG export
  const handleExport = () => {
    handleExportPNG();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts when typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Ctrl/Cmd + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl/Cmd + V: Paste
      else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.shiftKey) {
        e.preventDefault();
        handlePaste();
      }
      // Ctrl/Cmd + A: Select all
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        setSelectedShapes(new Set(shapes.map(s => s.id)));
        success(`Selected all ${shapes.length} shape(s)`);
      }
      // Delete or Backspace: Delete selected
      else if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedShape || selectedShapes.size > 0)) {
        e.preventDefault();
        handleDelete();
      }
      // Arrow keys: Nudge selected shapes
      else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && (selectedShape || selectedShapes.size > 0)) {
        e.preventDefault();
        const nudgeAmount = e.shiftKey ? 10 : 1; // Shift = big nudge
        const deltaX = e.key === 'ArrowLeft' ? -nudgeAmount : e.key === 'ArrowRight' ? nudgeAmount : 0;
        const deltaY = e.key === 'ArrowUp' ? -nudgeAmount : e.key === 'ArrowDown' ? nudgeAmount : 0;
        
        const shapeIds = selectedShapes.size > 0 
          ? Array.from(selectedShapes) 
          : [selectedShape];
        
        setShapes(shapes.map(s => 
          shapeIds.includes(s.id) ? { ...s, x: s.x + deltaX, y: s.y + deltaY } : s
        ));
        saveToHistory();
      }
      // Escape: Deselect
      else if (e.key === 'Escape') {
        setSelectedShape(null);
        setSelectedShapes(new Set());
        setShowTextInput(false);
        setConnectorStart(null);
      }
      // Ctrl/Cmd + Z: Undo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      else if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl/Cmd + D: Duplicate
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        handleDuplicate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape, selectedShapes, shapes, handleCopy, handlePaste, handleDelete, handleDuplicate, saveToHistory, handleUndo, handleRedo, success]);

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
      case 'circle': {
        const radius = Math.min(Math.abs(shape.width), Math.abs(shape.height)) / 2;
        ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, radius, 0, Math.PI * 2);
        break;
      }
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
      case 'diamond': {
        const dx = shape.width / 2;
        const dy = shape.height / 2;
        ctx.moveTo(shape.x + dx, shape.y);
        ctx.lineTo(shape.x + shape.width, shape.y + dy);
        ctx.lineTo(shape.x + dx, shape.y + shape.height);
        ctx.lineTo(shape.x, shape.y + dy);
        ctx.closePath();
        break;
      }
      case 'hexagon': {
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;
        const hexRadius = Math.min(shape.width, shape.height) / 2;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = centerX + hexRadius * Math.cos(angle);
          const y = centerY + hexRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      }
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

  // Optimized canvas rendering with requestAnimationFrame
  const animationFrameRef = useRef(null);
  
  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background FIRST (before transform)
      ctx.fillStyle = boardBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Apply zoom and pan
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      
      // Draw grid (optimized) - only show on dark backgrounds or when snapToGrid is enabled
      const isLightBackground = boardBackground === '#FFFFFF' || boardBackground === '#F3F4F6';
      const gridColor = isLightBackground ? '#E5E7EB' : '#1F2937';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      const gridSize = 20;
      
      // Calculate visible grid area accounting for zoom and pan
      const viewLeft = -pan.x / zoom;
      const viewTop = -pan.y / zoom;
      const viewRight = viewLeft + canvas.width / zoom;
      const viewBottom = viewTop + canvas.height / zoom;
      
      const startX = Math.floor(viewLeft / gridSize) * gridSize;
      const startY = Math.floor(viewTop / gridSize) * gridSize;
      const endX = Math.ceil(viewRight / gridSize) * gridSize;
      const endY = Math.ceil(viewBottom / gridSize) * gridSize;
      
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      
      // Draw shapes
      shapes.forEach(shape => {
        // Skip locked shapes - they'll be drawn with overlay later
        const isLocked = lockedShapes.has(shape.id);
        const isSelected = selectedShape === shape.id || selectedShapes.has(shape.id);
        
        if (shape.type === 'text') {
          ctx.fillStyle = shape.color || color;
          ctx.font = `${shape.fontSize || 16}px sans-serif`;
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          ctx.fillText(shape.text || '', shape.x, shape.y);
        } else if (shape.type === 'sticky') {
          ctx.fillStyle = shape.color || '#FEF08A';
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 2;
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          ctx.fillStyle = '#000';
          ctx.font = '14px sans-serif';
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          ctx.fillText(shape.text || 'New note', shape.x + 10, shape.y + 20);
        } else if (shape.type === 'connector') {
          // Draw connector line between shapes
          ctx.strokeStyle = shape.color || '#666';
          ctx.lineWidth = shape.strokeWidth || 2;
          ctx.beginPath();
          ctx.moveTo(shape.fromX, shape.fromY);
          ctx.lineTo(shape.toX, shape.toY);
          ctx.stroke();
          // Draw arrowhead
          const angle = Math.atan2(shape.toY - shape.fromY, shape.toX - shape.fromX);
          ctx.beginPath();
          ctx.moveTo(shape.toX, shape.toY);
          ctx.lineTo(shape.toX - 10 * Math.cos(angle - Math.PI / 6), shape.toY - 10 * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(shape.toX, shape.toY);
          ctx.lineTo(shape.toX - 10 * Math.cos(angle + Math.PI / 6), shape.toY - 10 * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        } else if (shape.type === 'image') {
          // Draw image if loaded, otherwise placeholder
          const imgUrl = shape.url || shape.src;
          const cachedImg = imagesLoadedRef.current[imgUrl];
          if (cachedImg && cachedImg.complete) {
            ctx.drawImage(cachedImg, shape.x, shape.y, shape.width || 200, shape.height || 150);
          } else {
            // Placeholder while loading
            ctx.fillStyle = '#666';
            ctx.fillRect(shape.x, shape.y, shape.width || 200, shape.height || 150);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 2;
            ctx.strokeRect(shape.x, shape.y, shape.width || 200, shape.height || 150);
          }
        } else {
          drawShape(ctx, shape);
        }
        
        // Draw lock overlay on top of shape
        if (isLocked) {
          ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
          ctx.fillRect(shape.x - 2, shape.y - 2, (shape.width || 100) + 4, (shape.height || 100) + 4);
          ctx.fillStyle = '#000';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔒', shape.x + (shape.width || 100) / 2, shape.y + (shape.height || 100) / 2);
        }
        
        // Draw selection outline (drawn after shape) - account for zoom
        if (isSelected && !isLocked) {
          const shapeWidth = Math.abs(shape.width || 100);
          const shapeHeight = Math.abs(shape.height || 100);
          const padding = 5 / zoom; // Account for zoom so padding stays constant
          
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2 / zoom; // Account for zoom so line width stays constant
          ctx.setLineDash([5 / zoom, 5 / zoom]); // Account for zoom
          ctx.strokeRect(shape.x - padding, shape.y - padding, shapeWidth + 2 * padding, shapeHeight + 2 * padding);
          ctx.setLineDash([]);
          
          // Draw resize handles for selected single shape (only if not locked)
          if (selectedShape === shape.id && (shape.type === 'rectangle' || shape.type === 'circle' || shape.type === 'sticky' || shape.type === 'image')) {
            const handleSize = 6 / zoom;
            const handles = [
              { x: shape.x - padding, y: shape.y - padding }, // Top-left
              { x: shape.x + shapeWidth + padding, y: shape.y - padding }, // Top-right
              { x: shape.x - padding, y: shape.y + shapeHeight + padding }, // Bottom-left
              { x: shape.x + shapeWidth + padding, y: shape.y + shapeHeight + padding } // Bottom-right
            ];
            handles.forEach(handle => {
              ctx.fillStyle = '#3B82F6';
              ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1 / zoom; // Account for zoom
              ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            });
          }
        }
      });
    
    // Draw selection box (already in canvas coordinates from getMousePos)
    if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2 / zoom; // Account for zoom so line width stays constant
      ctx.setLineDash([5 / zoom, 5 / zoom]); // Account for zoom
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.setLineDash([]);
    }
    
    // Draw current path
    if (isDrawing && drawPath.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      ctx.moveTo(drawPath[0].x, drawPath[0].y);
      drawPath.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }

    // Draw connector preview
    if (tool === 'connector' && connectorStart) {
      const pos = cursorPosition;
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(connectorStart.x, connectorStart.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    ctx.restore();
    };
    
    // Use requestAnimationFrame properly - don't create infinite loop
    const frameId = requestAnimationFrame(render);
    animationFrameRef.current = frameId;
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [shapes, selectedShape, selectedShapes, isDrawing, drawPath, zoom, pan, color, strokeWidth, tool, connectorStart, cursorPosition, selectionBox, lockedShapes, boardBackground, imageCache, snapToGrid]);

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

  // Load images for image shapes
  useEffect(() => {
    shapes.filter(s => s.type === 'image').forEach(shape => {
      const imgUrl = shape.url || shape.src;
      if (!imgUrl || imagesLoadedRef.current[imgUrl]) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imagesLoadedRef.current[imgUrl] = img;
        // Trigger re-render
        setImageCache(prev => ({ ...prev, [imgUrl]: true }));
      };
      img.onerror = () => {
        console.warn('Failed to load image:', imgUrl);
      };
      img.src = imgUrl;
    });
  }, [shapes]);

  // Load user's boards
  useEffect(() => {
    if (!user || !db) return;

    const boardsRef = collection(db, 'visualBoards');
    const q = query(boardsRef, where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const boardsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBoards(boardsList);
    }, (error) => {
      // If index missing, try without orderBy
      const fallbackQ = query(boardsRef, where('participants', 'array-contains', user.uid), limit(20));
      const fallbackUnsubscribe = onSnapshot(fallbackQ, (snapshot) => {
        const boardsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.() || new Date(a.createdAt?.toDate?.() || 0);
          const bTime = b.updatedAt?.toDate?.() || new Date(b.createdAt?.toDate?.() || 0);
          return bTime - aTime;
        });
        setBoards(boardsList);
      });
      return () => fallbackUnsubscribe();
    });

    return () => unsubscribe();
  }, [user, db]);

  // Initialize or load board from Firestore
  useEffect(() => {
    if (!user || !db || !currentBoardId) return;

    const boardRef = doc(db, 'visualBoards', currentBoardId);

    // Initialize board if it doesn't exist
    const initBoard = async () => {
      const boardDoc = await getDoc(boardRef);
      if (!boardDoc.exists()) {
        await setDoc(boardRef, {
          shapes: [],
          name: `Board ${new Date().toLocaleDateString()}`,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          participants: [user.uid],
          backgroundColor: boardBackground
        });
        success('New board created!');
      } else {
        const boardData = boardDoc.data();
        if (boardData.backgroundColor) {
          setBoardBackground(boardData.backgroundColor);
        }
      }
    };

    initBoard();

    // Real-time listener for board updates
    const unsubscribe = onSnapshot(boardRef, (snapshot) => {
      if (!snapshot.exists()) return;
      
      const boardData = snapshot.data();
      const remoteShapes = boardData.shapes || [];
      
      // Only update if change came from another user (not our local update)
      // Check if this is our local update by checking if debounce timer is active
      const isOurUpdate = isLocalUpdate.current || debounceTimer.current !== null;
      
      // Deep comparison to avoid unnecessary updates
      const currentShapesStr = JSON.stringify(shapes);
      const remoteShapesStr = JSON.stringify(remoteShapes);
      
      if (!isOurUpdate && currentShapesStr !== remoteShapesStr) {
        setShapes(remoteShapes);
        // Update history when receiving remote changes
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(remoteShapesStr);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        if (boardData.backgroundColor && boardData.backgroundColor !== boardBackground) {
          setBoardBackground(boardData.backgroundColor);
        }
      }
      
      // Reset local update flag after processing
      if (isLocalUpdate.current) {
        isLocalUpdate.current = false;
      }
    });

    return () => unsubscribe();
  }, [user, currentBoardId, db, success]);

  // Sync shapes to Firestore (debounced)
  useEffect(() => {
    if (!user || !db || !currentBoardId) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        isLocalUpdate.current = true;
        const boardRef = doc(db, 'visualBoards', currentBoardId);
        await updateDoc(boardRef, {
          shapes,
          updatedAt: serverTimestamp(),
          participants: arrayUnion(user.uid),
          backgroundColor: boardBackground
        });
      } catch (error) {
        console.error('Error syncing shapes:', error);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [shapes, user, currentBoardId, db, boardBackground]);

  // Track cursor position for collaboration
  useEffect(() => {
    if (!db || !currentBoardId || !user) return;

    const handleMouseMove = (e) => {
      const pos = getMousePos({ clientX: e.clientX, clientY: e.clientY });
      setCursorPosition(pos);
      
      const boardRef = doc(db, 'visualBoards', currentBoardId);
      const cursorRef = doc(boardRef, 'cursors', user.uid);
      setDoc(cursorRef, {
        x: pos.x,
        y: pos.y,
        userId: user.uid,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    };

    const throttledMove = (e) => {
      requestAnimationFrame(() => handleMouseMove(e));
    };

    window.addEventListener('mousemove', throttledMove);
    return () => window.removeEventListener('mousemove', throttledMove);
  }, [zoom, pan, db, currentBoardId, user]);

  // Listen to other users' cursors
  useEffect(() => {
    if (!user || !db || !currentBoardId) return;

    const cursorsRef = collection(db, 'visualBoards', currentBoardId, 'cursors');
    const unsubscribe = onSnapshot(cursorsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const cursorData = change.doc.data();
        if (cursorData.userId !== user.uid) {
          setCollaborators(prev => ({
            ...prev,
            [cursorData.userId]: {
              ...prev[cursorData.userId],
              cursor: { x: cursorData.x, y: cursorData.y },
              name: `User ${cursorData.userId.substring(0, 8)}`
            }
          }));
        }
      });
    });

    return () => unsubscribe();
  }, [user, currentBoardId, db]);

  // Clean up cursor on unmount
  useEffect(() => {
    return () => {
      if (db && currentBoardId && user) {
        const boardRef = doc(db, 'visualBoards', currentBoardId);
        const cursorRef = doc(boardRef, 'cursors', user.uid);
        setDoc(cursorRef, { userId: user.uid, active: false }, { merge: true }).catch(() => {});
      }
    };
  }, [db, currentBoardId, user]);

  // Load shapes when board changes
  useEffect(() => {
    if (!db || !currentBoardId) return;

    const loadBoard = async () => {
      const boardRef = doc(db, 'visualBoards', currentBoardId);
      const boardDoc = await getDoc(boardRef);
      if (boardDoc.exists()) {
        const boardData = boardDoc.data();
        setShapes(boardData.shapes || []);
        if (boardData.backgroundColor) {
          setBoardBackground(boardData.backgroundColor);
        }
      }
    };

    loadBoard();
  }, [currentBoardId, db]);

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
              { id: 'connector', icon: LinkIcon, label: 'Connector' },
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
                { id: 'arrow', icon: ArrowRight },
                { id: 'diamond', icon: Diamond },
                { id: 'hexagon', icon: Hexagon }
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

          {/* Copy/Paste */}
          <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
            <button
              onClick={handleCopy}
              disabled={!selectedShape && selectedShapes.size === 0}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Copy (Ctrl+C)"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={handlePaste}
              disabled={copiedShapes.length === 0}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Paste (Ctrl+V)"
            >
              <Scissors size={18} />
            </button>
          </div>

          {/* Alignment Tools */}
          {(selectedShape || selectedShapes.size > 0) && (
            <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
              <button
                onClick={() => handleAlign('left')}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Align Left"
                disabled={selectedShapes.size > 0 ? selectedShapes.size < 2 : true}
              >
                <AlignLeft size={18} />
              </button>
              <button
                onClick={() => handleAlign('center')}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Align Center"
                disabled={selectedShapes.size > 0 ? selectedShapes.size < 2 : true}
              >
                <AlignCenter size={18} />
              </button>
              <button
                onClick={() => handleAlign('right')}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Align Right"
                disabled={selectedShapes.size > 0 ? selectedShapes.size < 2 : true}
              >
                <AlignRight size={18} />
              </button>
              <button
                onClick={() => handleAlign('top')}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Align Top"
                disabled={selectedShapes.size > 0 ? selectedShapes.size < 2 : true}
              >
                <ArrowUp size={18} />
              </button>
              <button
                onClick={() => handleAlign('middle')}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Align Middle"
                disabled={selectedShapes.size > 0 ? selectedShapes.size < 2 : true}
              >
                <AlignCenter size={18} className="rotate-90" />
              </button>
              <button
                onClick={() => handleAlign('bottom')}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Align Bottom"
                disabled={selectedShapes.size > 0 ? selectedShapes.size < 2 : true}
              >
                <ArrowDown size={18} />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
            <button
              onClick={handleDelete}
              disabled={!selectedShape && selectedShapes.size === 0}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete (Del)"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Export PNG"
            >
              <Download size={18} />
            </button>
            <button
              onClick={handleExportSVG}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Export SVG"
            >
              <FileText size={18} />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Upload Image"
            >
              <Upload size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={handleDuplicate}
              disabled={!selectedShape && selectedShapes.size === 0}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Duplicate (Ctrl+D)"
            >
              <Copy size={18} />
            </button>
          </div>

          {/* Layer Management */}
          {selectedShape && (
            <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
              <button
                onClick={handleBringToFront}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Bring to Front"
              >
                <ArrowUpCircle size={18} />
              </button>
              <button
                onClick={handleSendToBack}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                title="Send to Back"
              >
                <ArrowDownCircle size={18} />
              </button>
              <button
                onClick={handleToggleLock}
                className={`p-2 rounded-lg transition-all ${
                  lockedShapes.has(selectedShape)
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-white/10'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title={lockedShapes.has(selectedShape) ? 'Unlock' : 'Lock'}
              >
                {lockedShapes.has(selectedShape) ? <Lock size={18} /> : <Unlock size={18} />}
              </button>
            </div>
          )}

          {/* Snap to Grid */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded-lg transition-all ${
              snapToGrid
                ? 'bg-indigo-600 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Snap to Grid"
          >
            <Grid size={18} />
          </button>

          {/* Auto-save Indicator */}
          {saving && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Loader size={14} className="animate-spin" />
              <span>Saving...</span>
            </div>
          )}

          {/* Board Manager */}
          <button
            onClick={() => setShowBoardManager(true)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
            title="Manage Boards"
          >
            <FileText size={18} />
          </button>

          {/* Board Background Color */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              title="Board Color"
            >
              <Palette size={18} />
            </button>
            {showColorPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-2 glass-panel border border-white/10 rounded-xl p-3 z-50"
              >
                <p className="text-xs text-white/60 mb-2">Board Color</p>
                <div className="grid grid-cols-4 gap-2">
                  {boardColors.map((bc) => (
                    <button
                      key={bc.value}
                      onClick={() => {
                        setBoardBackground(bc.value);
                        if (db && currentBoardId) {
                          updateDoc(doc(db, 'visualBoards', currentBoardId), {
                            backgroundColor: bc.value
                          }).catch(() => {});
                        }
                        setShowColorPicker(false);
                      }}
                      className={`w-8 h-8 rounded transition-all ${
                        boardBackground === bc.value ? 'ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: bc.value }}
                      title={bc.name}
                    />
                  ))}
                </div>
              </motion.div>
            )}
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
          className="absolute inset-0"
          style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
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
                zIndex: 1000
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

      {/* Board Manager Modal */}
      <AnimatePresence>
        {showBoardManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBoardManager(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Manage Boards</h3>
                <button
                  onClick={() => setShowBoardManager(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/70" />
                </button>
              </div>
              <div className="space-y-3 mb-4">
                {boards.map((board) => (
                  <motion.button
                    key={board.id}
                    onClick={() => {
                      setCurrentBoardId(board.id);
                      setShowBoardManager(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    className={`w-full p-3 glass-panel border rounded-xl text-left transition-all ${
                      currentBoardId === board.id ? 'border-indigo-500 bg-indigo-600/20' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{board.name || 'Untitled Board'}</p>
                        <p className="text-xs text-white/60">
                          {board.updatedAt?.toDate ? board.updatedAt.toDate().toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      {currentBoardId === board.id && (
                        <span className="text-xs text-indigo-400 font-medium">Current</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
              <button
                onClick={async () => {
                  const newBoardId = `board_${Date.now()}_${user?.uid}`;
                  if (db) {
                    await setDoc(doc(db, 'visualBoards', newBoardId), {
                      shapes: [],
                      name: `Board ${Date.now()}`,
                      createdBy: user.uid,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp(),
                      participants: [user.uid],
                      backgroundColor: boardBackground
                    });
                  }
                  setCurrentBoardId(newBoardId);
                  setShapes([]);
                  setShowBoardManager(false);
                  success('New board created!');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                <Plus size={18} className="inline mr-2" />
                Create New Board
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Properties Panel */}
      <AnimatePresence>
        {showPropertiesPanel && (selectedShape || selectedShapes.size > 0) && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="absolute right-4 top-20 w-64 glass-panel border border-white/10 rounded-xl p-4 z-30 max-h-[calc(100vh-200px)] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Properties</h3>
              <button
                onClick={() => setShowPropertiesPanel(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X size={16} className="text-white/70" />
              </button>
            </div>
            
            {selectedShape && (() => {
              const shape = shapes.find(s => s.id === selectedShape);
              if (!shape) return null;
              
              return (
                <div className="space-y-3">
                  {/* Color */}
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            setShapes(shapes.map(s => 
                              s.id === selectedShape ? { ...s, color: c } : s
                            ));
                            saveToHistory();
                          }}
                          className={`w-8 h-8 rounded ${shape.color === c ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Stroke Width */}
                  {(shape.type === 'path' || shape.type === 'connector' || shape.type === 'arrow') && (
                    <div>
                      <label className="text-xs text-white/60 mb-1 block">
                        Stroke: {shape.strokeWidth || strokeWidth}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={shape.strokeWidth || strokeWidth}
                        onChange={(e) => {
                          setShapes(shapes.map(s => 
                            s.id === selectedShape ? { ...s, strokeWidth: Number(e.target.value) } : s
                          ));
                          saveToHistory();
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Text Formatting */}
                  {(shape.type === 'text' || shape.type === 'sticky') && (
                    <div>
                      <label className="text-xs text-white/60 mb-1 block">Font Size</label>
                      <input
                        type="range"
                        min="10"
                        max="48"
                        value={shape.fontSize || 16}
                        onChange={(e) => {
                          setShapes(shapes.map(s => 
                            s.id === selectedShape ? { ...s, fontSize: Number(e.target.value) } : s
                          ));
                          saveToHistory();
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Position & Size */}
                  {(shape.width !== undefined || shape.height !== undefined) && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-white/60 mb-1 block">X</label>
                          <input
                            type="number"
                            value={Math.round(shape.x || 0)}
                            onChange={(e) => {
                              setShapes(shapes.map(s => 
                                s.id === selectedShape ? { ...s, x: Number(e.target.value) } : s
                              ));
                              saveToHistory();
                            }}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/60 mb-1 block">Y</label>
                          <input
                            type="number"
                            value={Math.round(shape.y || 0)}
                            onChange={(e) => {
                              setShapes(shapes.map(s => 
                                s.id === selectedShape ? { ...s, y: Number(e.target.value) } : s
                              ));
                              saveToHistory();
                            }}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                          />
                        </div>
                        {shape.width !== undefined && (
                          <>
                            <div>
                              <label className="text-xs text-white/60 mb-1 block">Width</label>
                              <input
                                type="number"
                                value={Math.round(shape.width || 0)}
                                onChange={(e) => {
                                  setShapes(shapes.map(s => 
                                    s.id === selectedShape ? { ...s, width: Number(e.target.value) } : s
                                  ));
                                  saveToHistory();
                                }}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-white/60 mb-1 block">Height</label>
                              <input
                                type="number"
                                value={Math.round(shape.height || 0)}
                                onChange={(e) => {
                                  setShapes(shapes.map(s => 
                                    s.id === selectedShape ? { ...s, height: Number(e.target.value) } : s
                                  ));
                                  saveToHistory();
                                }}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimap */}
      {showMinimap && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-24 right-4 w-48 h-32 glass-panel border border-white/10 rounded-lg p-2 z-20"
        >
          <div className="text-xs text-white/60 mb-1 flex items-center justify-between">
            <span>Minimap</span>
            <button
              onClick={() => {
                // Zoom to fit all shapes
                if (shapes.length === 0) return;
                const bounds = shapes.reduce((acc, s) => {
                  const left = s.x;
                  const right = s.x + (s.width || 100);
                  const top = s.y;
                  const bottom = s.y + (s.height || 100);
                  return {
                    left: Math.min(acc.left, left),
                    right: Math.max(acc.right, right),
                    top: Math.min(acc.top, top),
                    bottom: Math.max(acc.bottom, bottom)
                  };
                }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
                
                const width = bounds.right - bounds.left;
                const height = bounds.bottom - bounds.top;
                const containerRect = containerRef.current?.getBoundingClientRect();
                if (containerRect) {
                  const scaleX = containerRect.width / (width + 100);
                  const scaleY = containerRect.height / (height + 100);
                  const newZoom = Math.min(scaleX, scaleY, 1);
                  setZoom(newZoom);
                  setPan({
                    x: containerRect.width / 2 - (bounds.left + width / 2) * newZoom,
                    y: containerRect.height / 2 - (bounds.top + height / 2) * newZoom
                  });
                  success('Zoomed to fit all shapes');
                }
              }}
              className="px-2 py-0.5 bg-indigo-600/50 hover:bg-indigo-600 rounded text-xs text-white"
              title="Zoom to Fit"
            >
              Fit
            </button>
          </div>
          <div className="relative w-full h-24 bg-white/5 rounded overflow-hidden">
            {/* Minimap viewport indicator */}
            <div
              className="absolute border-2 border-indigo-400 bg-indigo-400/20"
              style={{
                left: `${(pan.x / zoom + 100) / 10}%`,
                top: `${(pan.y / zoom + 100) / 10}%`,
                width: `${(containerRef.current?.getBoundingClientRect().width || 1000) / zoom / 10}%`,
                height: `${(containerRef.current?.getBoundingClientRect().height || 1000) / zoom / 10}%`
              }}
            />
            {/* Mini shapes */}
            <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
              {shapes.slice(0, 50).map(shape => (
                <rect
                  key={shape.id}
                  x={`${(shape.x || 0) / 10}%`}
                  y={`${(shape.y || 0) / 10}%`}
                  width={`${((shape.width || 100) / 10)}%`}
                  height={`${((shape.height || 100) / 10)}%`}
                  fill={shape.color || '#3B82F6'}
                  opacity={0.5}
                />
              ))}
            </svg>
          </div>
        </motion.div>
      )}

      {/* Properties Panel Toggle */}
      {(selectedShape || selectedShapes.size > 0) && !showPropertiesPanel && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowPropertiesPanel(true)}
          className="absolute right-4 top-20 p-2 glass-panel border border-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all z-20"
          title="Show Properties"
        >
          <Grid3x3 size={18} />
        </motion.button>
      )}

      {/* Info Bar */}
      <div className="glass-panel border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-4">
          <span>Shapes: {shapes.length}</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Tool: {tool}</span>
          {connectorStart && <span className="text-indigo-400">Click shape to connect</span>}
          {selectedShapes.size > 1 && <span className="text-indigo-400">{selectedShapes.size} selected</span>}
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
