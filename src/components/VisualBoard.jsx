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
import { RenderingEngine } from '../utils/visualBoardEngine';
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
  
  // Debug: Log mount state for troubleshooting
  useEffect(() => {
    console.log('[VisualBoard] Mounted', { 
      user: user?.uid, 
      db: !!db, 
      boardId,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    });
    return () => console.log('[VisualBoard] Unmounted');
  }, []);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [currentBoardId, setCurrentBoardId] = useState(boardId || `board_${Date.now()}_${user?.uid}`);
  const [tool, setTool] = useState('select'); // select, pen, text, shape, connector, sticky
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPath, setDrawPath] = useState([]);
  const [isDrawingShape, setIsDrawingShape] = useState(false); // Track if we're actively drawing a shape
  const [drawingShapeId, setDrawingShapeId] = useState(null); // Track which shape we're drawing
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
  const textInputRef = useRef(null); // Ref for text input to manage focus
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
  const [layers, setLayers] = useState([]); // Layer management: [{ id, name, visible, locked, shapes: [shapeIds] }]
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
  const [canvasReady, setCanvasReady] = useState(false); // Track when canvas has valid dimensions
  const shapesRef = useRef([]); // Ref for shapes to avoid stale closures in Firestore sync
  const boardBackgroundRef = useRef('#111827'); // Ref for board background
  const renderingEngineRef = useRef(null); // Rendering engine instance

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

  // Save to history - use refs to get current shapes
  // ✅ FIX: Avoid nested setState calls (React error #426)
  // Use refs to access current state, then update states sequentially
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  
  // Sync refs with state
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);
  
  const saveToHistory = useCallback(() => {
    const currentShapesStr = JSON.stringify(shapesRef.current);
    const prevHistory = historyRef.current;
    const prevIndex = historyIndexRef.current;
    const newHistory = prevHistory.slice(0, prevIndex + 1);
    newHistory.push(currentShapesStr);
    const newIndex = newHistory.length - 1;
    
    // Update states sequentially, not nested
    setHistory(newHistory);
    setHistoryIndex(newIndex);
  }, []); // No dependencies - uses refs

  // Undo/Redo - use functional updates
  // ✅ FIX: Avoid nested setState calls (React error #426)
  // Update states sequentially, not nested
  const handleUndo = useCallback(() => {
    const prevHistory = historyRef.current;
    const prevIndex = historyIndexRef.current;
    
    if (prevIndex > 0) {
      const newIndex = prevIndex - 1;
      const prevShapes = JSON.parse(prevHistory[newIndex]);
      
      // Update states sequentially, not nested
      setShapes(prevShapes);
      setHistoryIndex(newIndex);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const prevHistory = historyRef.current;
    const prevIndex = historyIndexRef.current;
    
    if (prevIndex < prevHistory.length - 1) {
      const newIndex = prevIndex + 1;
      const nextShapes = JSON.parse(prevHistory[newIndex]);
      
      // Update states sequentially, not nested
      setShapes(nextShapes);
      setHistoryIndex(newIndex);
    }
  }, []);

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
    // Prevent default for middle mouse button to avoid scrolling
    if (e.button === 1) {
      e.preventDefault();
    }
    
    // Don't handle if clicking on text input
    if (e.target.tagName === 'INPUT' || e.target.closest('input')) {
      return;
    }
    
    const pos = getMousePos(e);
    
    if (tool === 'select') {
      // Use rendering engine for fast hit testing with spatial index
      const clickedShape = renderingEngineRef.current?.hitTest(
        pos.x, 
        pos.y, 
        shapesRef.current, 
        { 
          radius: 10, 
          excludeLocked: tool !== 'connector',
          lockedShapes 
        }
      ) || null;
      
      setShapes(prevShapes => {
        
        if (clickedShape) {
          // Multi-select with Shift
          if (e.shiftKey) {
            setSelectedShapes(prevSelected => {
              const newSelection = new Set(prevSelected);
              if (newSelection.has(clickedShape.id)) {
                newSelection.delete(clickedShape.id);
                if (newSelection.size === 0) setSelectedShape(null);
              } else {
                newSelection.add(clickedShape.id);
              }
              setSelectedShape(clickedShape.id);
              return newSelection;
            });
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
            setTimeout(() => {
              if (textInputRef.current) {
                textInputRef.current.focus();
                textInputRef.current.select();
              }
            }, 0);
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
          if (!e.shiftKey && e.button === 0 && tool === 'select') {
            setSelectedShape(null);
            setSelectedShapes(new Set());
            setIsSelecting(true);
            setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
          }
        }
        return prevShapes; // Don't modify shapes
      });
      
      // Start panning with middle mouse button or space + drag
      if (e.button === 1 || (e.button === 0 && (e.spaceKey || e.altKey))) {
        e.preventDefault();
        setIsPanning(true);
        setPan(prevPan => {
          setPanStart({ x: e.clientX - prevPan.x, y: e.clientY - prevPan.y });
          return prevPan;
        });
      }
    } else if (tool === 'pen') {
      setIsDrawing(true);
      setDrawPath([pos]);
      // Clear selection when starting to draw
      setSelectedShape(null);
      setSelectedShapes(new Set());
    } else if (tool === 'text') {
      // Use rendering engine for fast hit testing
      const clickedShape = renderingEngineRef.current?.hitTest(
        pos.x, 
        pos.y, 
        shapesRef.current.filter(s => s.type === 'text'),
        { radius: 10 }
      ) || null;
      
      setShapes(prevShapes => {
        
        if (!clickedShape) {
          setTextPosition(pos);
          setTextInput('');
          setShowTextInput(true);
          setEditingText(null);
          // Focus input after state update
          setTimeout(() => {
            if (textInputRef.current) {
              textInputRef.current.focus();
              textInputRef.current.select();
            }
          }, 0);
        }
        return prevShapes; // Don't modify shapes
      });
    } else if (tool === 'connector') {
      // Find shape at click position - use functional update
      setShapes(prevShapes => {
        const clickedShape = [...prevShapes].reverse().find(s => {
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
            setShapes(prev => [...prev, newConnector]);
            setConnectorStart(null);
            saveToHistory();
          }
        }
        return prevShapes; // Don't modify shapes here
      });
    } else if (tool === 'shape') {
      const newShapeId = Date.now();
      const newShape = {
        id: newShapeId,
        type: shapeType,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color,
        strokeWidth
      };
      setShapes(prev => [...prev, newShape]);
      setSelectedShape(newShapeId);
      setIsDrawingShape(true);
      setDrawingShapeId(newShapeId);
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
      setShapes(prev => [...prev, newSticky]);
      setSelectedShape(newSticky.id);
      saveToHistory();
    }
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    // Prevent panning if text input is open
    if (showTextInput) return;
    
    const pos = getMousePos(e);
    setCursorPosition(pos); // Always update cursor for connector preview
    
    if (isPanning) {
      setPan(prevPan => ({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
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
      setDrawPath(prevPath => [...prevPath, pos]);
    } else if (tool === 'shape' && isDrawingShape && drawingShapeId) {
      // Use functional update to ensure we have the latest shapes
      setShapes(prevShapes => {
        const shape = prevShapes.find(s => s.id === drawingShapeId);
        if (shape) {
          const newWidth = pos.x - shape.x;
          const newHeight = pos.y - shape.y;
          return prevShapes.map(s => 
            s.id === drawingShapeId
              ? { ...s, width: newWidth, height: newHeight }
              : s
          );
        }
        return prevShapes;
      });
    } else if (tool === 'connector' && connectorStart) {
      // Cursor position already updated above
    } else if (tool === 'select' && dragStart) {
      // Drag selected shape(s) - use proper offset calculation with functional updates
      setSelectedShape(prevSelectedShape => {
        setSelectedShapes(prevSelectedShapes => {
          if (!dragStart.shapeX || !dragStart.shapeY || (prevSelectedShape && lockedShapes.has(prevSelectedShape))) {
            return prevSelectedShapes;
          }
          
          const deltaX = pos.x - dragStart.clickX;
          const deltaY = pos.y - dragStart.clickY;
          
          // Don't move if delta is too small (prevents jitter)
          if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) return prevSelectedShapes;
          
          const shapeIds = prevSelectedShapes.size > 0 
            ? Array.from(prevSelectedShapes)
            : [prevSelectedShape].filter(Boolean);
          
          if (shapeIds.length === 0) return prevSelectedShapes;
          
          // Move all selected shapes by the same delta
          setShapes(prevShapes => {
            const firstShape = prevShapes.find(s => s.id === prevSelectedShape);
            if (!firstShape) return prevShapes;
            
            const baseX = dragStart.shapeX !== undefined ? dragStart.shapeX : firstShape.x;
            const baseY = dragStart.shapeY !== undefined ? dragStart.shapeY : firstShape.y;
            const newFirstX = baseX + deltaX;
            const newFirstY = baseY + deltaY;
            const offsetX = newFirstX - firstShape.x;
            const offsetY = newFirstY - firstShape.y;
            
            return prevShapes.map(s => {
              if (!shapeIds.includes(s.id) || lockedShapes.has(s.id)) return s;
              
              let newX = s.x + offsetX;
              let newY = s.y + offsetY;
              
              // Apply snap to grid if enabled
              if (snapToGrid) {
                const snap = 20;
                newX = Math.round(newX / snap) * snap;
                newY = Math.round(newY / snap) * snap;
              }
              
              return { ...s, x: newX, y: newY };
            });
          });
          return prevSelectedShapes;
        });
        return prevSelectedShape;
      });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    // Finalize selection box - use functional updates
    if (isSelecting && selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      setShapes(prevShapes => {
        const selectedIds = new Set();
        prevShapes.forEach(shape => {
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
        return prevShapes; // Don't modify shapes
      });
    }
    
    if (isDrawing && tool === 'pen') {
      setDrawPath(prevPath => {
        if (prevPath.length > 1) {
          const newPath = {
            id: Date.now(),
            type: 'path',
            points: [...prevPath],
            color,
            strokeWidth
          };
          setShapes(prevShapes => [...prevShapes, newPath]);
          saveToHistory();
        }
        return []; // Clear path
      });
    }
    
    setIsDrawing(false);
    setIsPanning(false);
    setIsSelecting(false);
    setDragStart(null);
    setResizingHandle(null);
    
    // Finalize shape drawing
    if (isDrawingShape && drawingShapeId) {
      const finalShapeId = drawingShapeId;
      setIsDrawingShape(false);
      setDrawingShapeId(null);
      // Ensure shape has minimum size
      setShapes(prevShapes => {
        const updated = prevShapes.map(s => {
          if (s.id === finalShapeId) {
            const minSize = 20;
            const newWidth = Math.abs(s.width) < minSize ? (s.width >= 0 ? minSize : -minSize) : s.width;
            const newHeight = Math.abs(s.height) < minSize ? (s.height >= 0 ? minSize : -minSize) : s.height;
            // Only save to history if shape has meaningful size
            if (Math.abs(newWidth) >= minSize && Math.abs(newHeight) >= minSize) {
              saveToHistory();
            }
            return {
              ...s,
              width: newWidth,
              height: newHeight
            };
          }
          return s;
        });
        return updated;
      });
    }
  };

  // Handle text input - use functional updates
  const handleTextSubmit = useCallback((e) => {
    // Prevent default if event exists
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setEditingText(prevEditing => {
      const currentEditing = prevEditing;
      const currentText = textInput;
      
      if (currentEditing) {
        // Update existing text
        setShapes(prevShapes => {
          const updated = prevShapes.map(s => 
            s.id === currentEditing 
              ? { ...s, text: currentText.trim() || s.text }
              : s
          );
          saveToHistory();
          return updated;
        });
        setEditingText(null);
      } else if (currentText.trim()) {
        // Create new text
        const newText = {
          id: Date.now(),
          type: 'text',
          x: textPosition.x,
          y: textPosition.y,
          text: currentText.trim(),
          color,
          fontSize: textFormatting.fontSize || 16
        };
        setShapes(prevShapes => {
          const updated = [...prevShapes, newText];
          saveToHistory();
          return updated;
        });
      }
      setTextInput('');
      setShowTextInput(false);
      
      // Return focus to canvas
      if (containerRef.current) {
        containerRef.current.focus();
      }
      return null;
    });
  }, [textInput, textPosition, color, textFormatting.fontSize, saveToHistory]);
  
  // Handle text input cancel
  const handleTextCancel = () => {
    setTextInput('');
    setShowTextInput(false);
    setEditingText(null);
    if (containerRef.current) {
      containerRef.current.focus();
    }
  };

  // Delete selected shape(s) - use functional updates
  const handleDelete = useCallback(() => {
    setShapes(prevShapes => {
      setSelectedShapes(prevSelected => {
        setSelectedShape(prevShape => {
          if (prevSelected.size > 0) {
            // Multi-delete
            const updated = prevShapes.filter(s => !prevSelected.has(s.id));
            setShapes(updated);
            setSelectedShapes(new Set());
            setSelectedShape(null);
            saveToHistory();
          } else if (prevShape) {
            // Single delete
            const updated = prevShapes.filter(s => s.id !== prevShape);
            setShapes(updated);
            setSelectedShape(null);
            saveToHistory();
          }
          return null;
        });
        return new Set();
      });
      return prevShapes;
    });
  }, [saveToHistory]);

  // Copy selected shapes - use functional updates
  const handleCopy = useCallback(() => {
    setShapes(prevShapes => {
      setSelectedShapes(prevSelected => {
        setSelectedShape(prevShape => {
          const shapesToCopy = prevSelected.size > 0
            ? prevShapes.filter(s => prevSelected.has(s.id))
            : prevShape ? prevShapes.filter(s => s.id === prevShape) : [];
          
          if (shapesToCopy.length > 0) {
            setCopiedShapes(shapesToCopy.map(s => ({ ...s, id: undefined })));
            success(`Copied ${shapesToCopy.length} shape(s)`);
          }
          return prevShape;
        });
        return prevSelected;
      });
      return prevShapes;
    });
  }, [success]);

  // Paste copied shapes - use functional updates
  const handlePaste = useCallback(() => {
    if (copiedShapes.length === 0) return;
    
    const offset = 20; // Offset for pasted shapes
    const newShapes = copiedShapes.map((shape, idx) => ({
      ...shape,
      id: Date.now() + idx,
      x: (shape.x || 0) + offset,
      y: (shape.y || 0) + offset
    }));
    
    setShapes(prev => [...prev, ...newShapes]);
    setSelectedShapes(new Set(newShapes.map(s => s.id)));
    saveToHistory();
    success(`Pasted ${newShapes.length} shape(s)`);
  }, [copiedShapes, saveToHistory, success]);

  // Align shapes - use functional updates
  const handleAlign = useCallback((direction) => {
    setShapes(prevShapes => {
      setSelectedShapes(prevSelected => {
        setSelectedShape(prevShape => {
          const shapesToAlign = prevSelected.size > 0
            ? prevShapes.filter(s => prevSelected.has(s.id))
            : prevShape ? prevShapes.filter(s => s.id === prevShape) : [];
          
          if (shapesToAlign.length < 2) {
            return prevShape;
          }

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

          const updatedShapes = prevShapes.map(s => {
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
          return prevShape;
        });
        return prevSelected;
      });
      return prevShapes;
    });
  }, [saveToHistory, success]);

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

  // Export to SVG - use ref to get latest shapes
  const handleExportSVG = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '2000');
    svg.setAttribute('height', '2000');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Add background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', boardBackgroundRef.current);
    svg.appendChild(rect);
    
    // Add shapes - use ref to get latest
    shapesRef.current.forEach(shape => {
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
        setShapes(prev => [...prev, newImageShape]);
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

  // Duplicate selected shapes - use functional updates
  const handleDuplicate = useCallback(() => {
    setShapes(prevShapes => {
      setSelectedShapes(prevSelected => {
        setSelectedShape(prevShape => {
          const shapesToDuplicate = prevSelected.size > 0
            ? prevShapes.filter(s => prevSelected.has(s.id))
            : prevShape ? prevShapes.filter(s => s.id === prevShape) : [];
          
          if (shapesToDuplicate.length === 0) return prevShape;
          
          const offset = 30; // Offset for duplicated shapes
          const newShapes = shapesToDuplicate.map((shape, idx) => ({
            ...shape,
            id: Date.now() + idx,
            x: (shape.x || 0) + offset,
            y: (shape.y || 0) + offset
          }));
          
          setShapes(prev => [...prev, ...newShapes]);
          setSelectedShapes(new Set(newShapes.map(s => s.id)));
          setSelectedShape(newShapes[0]?.id || null);
          saveToHistory();
          success(`Duplicated ${newShapes.length} shape(s)`);
          return newShapes[0]?.id || null;
        });
        return prevSelected;
      });
      return prevShapes;
    });
  }, [saveToHistory, success]);

  // Layer management - Bring to front - use functional updates
  const handleBringToFront = useCallback(() => {
    setSelectedShape(prevShape => {
      if (!prevShape) return prevShape;
      
      setShapes(prevShapes => {
        const shape = prevShapes.find(s => s.id === prevShape);
        if (!shape) return prevShapes;
        
        const otherShapes = prevShapes.filter(s => s.id !== prevShape);
        const updated = [...otherShapes, shape];
        saveToHistory();
        success('Shape brought to front');
        return updated;
      });
      return prevShape;
    });
  }, [saveToHistory, success]);

  // Layer management - Send to back - use functional updates
  const handleSendToBack = useCallback(() => {
    setSelectedShape(prevShape => {
      if (!prevShape) return prevShape;
      
      setShapes(prevShapes => {
        const shape = prevShapes.find(s => s.id === prevShape);
        if (!shape) return prevShapes;
        
        const otherShapes = prevShapes.filter(s => s.id !== prevShape);
        const updated = [shape, ...otherShapes];
        saveToHistory();
        success('Shape sent to back');
        return updated;
      });
      return prevShape;
    });
  }, [saveToHistory, success]);

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

  // Group selected shapes
  const handleGroup = useCallback(() => {
    setShapes(prevShapes => {
      setSelectedShapes(prevSelected => {
        if (prevSelected.size < 2) {
          success('Select at least 2 shapes to group');
          return prevSelected;
        }

        const { updatedShapes, newGroup } = groupShapes(prevShapes, prevSelected);
        if (newGroup) {
          setSelectedShapes(new Set([newGroup.id]));
          setSelectedShape(newGroup.id);
          saveToHistory();
          success(`Grouped ${prevSelected.size} shape(s)`);
        }
        return new Set([newGroup?.id].filter(Boolean));
      });
      return prevShapes;
    });
  }, [saveToHistory, success]);

  // Ungroup selected group
  const handleUngroup = useCallback(() => {
    setShapes(prevShapes => {
      setSelectedShape(prevShape => {
        if (!prevShape) return prevShape;
        
        const shape = prevShapes.find(s => s.id === prevShape);
        if (!shape || shape.type !== 'group') {
          success('Select a group to ungroup');
          return prevShape;
        }

        const updated = ungroupShapes(prevShapes, prevShape);
        setShapes(updated);
        setSelectedShape(null);
        setSelectedShapes(new Set());
        saveToHistory();
        success('Group ungrouped');
        return null;
      });
      return prevShapes;
    });
  }, [saveToHistory, success]);

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
        setShapes(prevShapes => {
          setSelectedShapes(new Set(prevShapes.map(s => s.id)));
          success(`Selected all ${prevShapes.length} shape(s)`);
          return prevShapes;
        });
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
        
        setShapes(prevShapes => {
          const updated = prevShapes.map(s => 
            shapeIds.includes(s.id) ? { ...s, x: s.x + deltaX, y: s.y + deltaY } : s
          );
          saveToHistory();
          return updated;
        });
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
  }, [selectedShape, selectedShapes, shapes, handleCopy, handlePaste, handleDelete, handleDuplicate, handleGroup, handleUngroup, saveToHistory, handleUndo, handleRedo, success]);

  // Initialize rendering engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize rendering engine
    renderingEngineRef.current = new RenderingEngine(canvas, { cellSize: 100 });
    
    return () => {
      if (renderingEngineRef.current) {
        renderingEngineRef.current.destroy();
        renderingEngineRef.current = null;
      }
    };
  }, []);

  // Update engine when shapes change
  useEffect(() => {
    if (renderingEngineRef.current && shapes.length >= 0) {
      renderingEngineRef.current.updateShapes(shapes);
    }
  }, [shapes]);

  // Optimized canvas rendering with requestAnimationFrame
  const animationFrameRef = useRef(null);
  
  // Render canvas using rendering engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderingEngineRef.current) return;
    
    const render = () => {
      renderingEngineRef.current.render({
        shapes,
        selectedShape,
        selectedShapes,
        zoom,
        pan,
        boardBackground,
        lockedShapes,
        drawPath,
        isDrawing,
        color,
        strokeWidth,
        selectionBox,
        connectorStart,
        cursorPosition,
        tool,
        gridSize: 20,
        showGrid: true
      });
    };
    
    // Proper animation loop - only create one frame, then let it loop
    let animationId = null;
    const loop = () => {
      render();
      animationId = requestAnimationFrame(loop);
      animationFrameRef.current = animationId;
    };
    
    // Start the loop
    animationId = requestAnimationFrame(loop);
    animationFrameRef.current = animationId;
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [shapes, selectedShape, selectedShapes, isDrawing, drawPath, zoom, pan, color, strokeWidth, tool, connectorStart, cursorPosition, selectionBox, lockedShapes, boardBackground, canvasReady, isDrawingShape, drawingShapeId]);

  // Update canvas size - use ResizeObserver for reliable sizing
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Only update if dimensions are valid (not 0)
        if (rect.width > 0 && rect.height > 0) {
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
          // Mark canvas as ready to trigger re-render
          if (!canvasReady) {
            setCanvasReady(true);
          }
        }
      }
    };
    
    // Use ResizeObserver for reliable initial sizing and container changes
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            updateCanvasSize();
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }
    
    // Also update on window resize as fallback
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Delayed update to catch animation completion
    const delayedUpdate = setTimeout(updateCanvasSize, 500);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      clearTimeout(delayedUpdate);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvasReady]);

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

    // Real-time listener for board updates - use refs to avoid stale closures
    const unsubscribe = onSnapshot(boardRef, (snapshot) => {
      if (!snapshot.exists()) return;
      
      const boardData = snapshot.data();
      const remoteShapes = boardData.shapes || [];
      
      // Only update if change came from another user (not our local update)
      // Check if this is our local update by checking if debounce timer is active
      const isOurUpdate = isLocalUpdate.current || debounceTimer.current !== null;
      
      if (!isOurUpdate) {
        // Use functional updates to get latest state
        setShapes(prevShapes => {
          // Deep comparison to avoid unnecessary updates
          const currentShapesStr = JSON.stringify(prevShapes);
          const remoteShapesStr = JSON.stringify(remoteShapes);
          
          if (currentShapesStr !== remoteShapesStr) {
            // Update history when receiving remote changes
            setHistory(prevHistory => {
              setHistoryIndex(prevIndex => {
                const newHistory = prevHistory.slice(0, prevIndex + 1);
                newHistory.push(remoteShapesStr);
                setHistory(newHistory);
                return newHistory.length - 1;
              });
              return prevHistory;
            });
            
            if (boardData.backgroundColor) {
              setBoardBackground(prevBg => {
                if (boardData.backgroundColor !== prevBg) {
                  return boardData.backgroundColor;
                }
                return prevBg;
              });
            }
            
            return remoteShapes;
          }
          return prevShapes;
        });
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

  // Load shapes when board changes and initialize history
  useEffect(() => {
    if (!db || !currentBoardId) return;

    const loadBoard = async () => {
      const boardRef = doc(db, 'visualBoards', currentBoardId);
      const boardDoc = await getDoc(boardRef);
      if (boardDoc.exists()) {
        const boardData = boardDoc.data();
        const loadedShapes = boardData.shapes || [];
        setShapes(loadedShapes);
        
        // Initialize history with loaded shapes
        const initialHistory = [JSON.stringify(loadedShapes)];
        setHistory(initialHistory);
        setHistoryIndex(0);
        
        if (boardData.backgroundColor) {
          setBoardBackground(boardData.backgroundColor);
        }
      } else {
        // New board - initialize empty history
        setHistory([]);
        setHistoryIndex(-1);
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

          {/* Grouping */}
          {(selectedShapes.size >= 2 || (selectedShape && shapesRef.current.find(s => s.id === selectedShape)?.type === 'group')) && (
            <div className="flex items-center gap-1 glass-panel border border-white/10 rounded-xl p-1">
              {selectedShapes.size >= 2 && (
                <button
                  onClick={handleGroup}
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                  title="Group (Ctrl+G)"
                >
                  <Boxes size={18} />
                </button>
              )}
              {selectedShape && shapesRef.current.find(s => s.id === selectedShape)?.type === 'group' && (
                <button
                  onClick={handleUngroup}
                  className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                  title="Ungroup (Ctrl+Shift+G)"
                >
                  <Box size={18} />
                </button>
              )}
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
        onMouseDown={(e) => {
          // Don't handle mouse down if clicking on text input
          if (e.target.tagName === 'INPUT' || e.target.closest('input')) {
            return;
          }
          handleMouseDown(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
        }}
        tabIndex={0}
        style={{ outline: 'none' }}
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
              className="absolute glass-panel border border-white/20 rounded-lg p-2 shadow-2xl"
              style={{
                left: `${(textPosition.x * zoom) + pan.x}px`,
                top: `${(textPosition.y * zoom) + pan.y}px`,
                zIndex: 1000,
                minWidth: '200px',
                transform: 'translate(0, 0)' // Ensure proper positioning
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                ref={textInputRef}
                type="text"
                value={textInput}
                onChange={(e) => {
                  e.stopPropagation();
                  setTextInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    handleTextSubmit(e);
                  } else if (e.key === 'Escape') {
                    handleTextCancel();
                  }
                }}
                onBlur={(e) => {
                  // Delay blur to allow Enter key to process first
                  setTimeout(() => {
                    if (textInput.trim() || editingText) {
                      handleTextSubmit(e);
                    } else {
                      handleTextCancel();
                    }
                  }, 200);
                }}
                autoFocus
                className="px-3 py-2 bg-white text-black rounded border-2 border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
                style={{ fontSize: `${textFormatting.fontSize || 16}px` }}
                placeholder="Type text here..."
              />
              <div className="mt-1 flex items-center gap-1 text-xs text-white/60">
                <span>Press Enter to save, Esc to cancel</span>
              </div>
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

      {/* Background Color Picker Modal */}
      <AnimatePresence>
        {showColorPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              onClick={() => setShowColorPicker(false)}
            />
            {/* Color Picker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="fixed top-20 right-4 glass-panel border border-white/10 rounded-xl p-3 z-[101] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Board Color</p>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X size={16} className="text-white/70" />
                </button>
              </div>
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
                    className={`w-10 h-10 rounded transition-all hover:scale-110 ${
                      boardBackground === bc.value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                    }`}
                    style={{ backgroundColor: bc.value }}
                    title={bc.name}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
            className="absolute right-4 top-20 w-64 glass-panel border border-white/10 rounded-xl p-4 z-[90] max-h-[calc(100vh-200px)] overflow-y-auto"
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
              // Use functional update to get latest shape
              const shape = shapesRef.current.find(s => s.id === selectedShape);
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
                            setShapes(prevShapes => {
                              const updated = prevShapes.map(s => 
                                s.id === selectedShape ? { ...s, color: c } : s
                              );
                              saveToHistory();
                              return updated;
                            });
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
                          setShapes(prevShapes => {
                            const updated = prevShapes.map(s => 
                              s.id === selectedShape ? { ...s, strokeWidth: Number(e.target.value) } : s
                            );
                            saveToHistory();
                            return updated;
                          });
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
                          setShapes(prevShapes => {
                            const updated = prevShapes.map(s => 
                              s.id === selectedShape ? { ...s, fontSize: Number(e.target.value) } : s
                            );
                            saveToHistory();
                            return updated;
                          });
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
                              setShapes(prevShapes => {
                                const updated = prevShapes.map(s => 
                                  s.id === selectedShape ? { ...s, x: Number(e.target.value) } : s
                                );
                                saveToHistory();
                                return updated;
                              });
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
                              setShapes(prevShapes => {
                                const updated = prevShapes.map(s => 
                                  s.id === selectedShape ? { ...s, y: Number(e.target.value) } : s
                                );
                                saveToHistory();
                                return updated;
                              });
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
                                  setShapes(prevShapes => {
                                    const updated = prevShapes.map(s => 
                                      s.id === selectedShape ? { ...s, width: Number(e.target.value) } : s
                                    );
                                    saveToHistory();
                                    return updated;
                                  });
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
                                  setShapes(prevShapes => {
                                    const updated = prevShapes.map(s => 
                                      s.id === selectedShape ? { ...s, height: Number(e.target.value) } : s
                                    );
                                    saveToHistory();
                                    return updated;
                                  });
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
                // Zoom to fit all shapes - use ref to get latest
                if (shapesRef.current.length === 0) return;
                const bounds = shapesRef.current.reduce((acc, s) => {
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
              {shapes.slice(0, 50).map(shape => {
                const shapeWidth = Math.abs(shape.width || 100);
                const shapeHeight = Math.abs(shape.height || 100);
                return (
                  <rect
                    key={shape.id}
                    x={`${Math.max(0, (shape.x || 0) / 10)}%`}
                    y={`${Math.max(0, (shape.y || 0) / 10)}%`}
                    width={`${Math.max(1, shapeWidth / 10)}%`}
                    height={`${Math.max(1, shapeHeight / 10)}%`}
                    fill={shape.color || '#3B82F6'}
                    opacity={0.5}
                  />
                );
              })}
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
          <span>Shapes: {shapesRef.current.length}</span>
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
