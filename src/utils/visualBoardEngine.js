/**
 * Visual Board Rendering Engine
 * High-performance engine for canvas-based whiteboard with spatial indexing
 * and optimized rendering
 */

// Spatial Index using simple grid-based approach (can be upgraded to R-tree)
class SpatialIndex {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  // Convert world coordinates to grid cell key
  _getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  // Get all cells that a bounding box overlaps
  _getCellsForBounds(bounds) {
    const cells = new Set();
    const minX = Math.floor(bounds.left / this.cellSize);
    const maxX = Math.floor(bounds.right / this.cellSize);
    const minY = Math.floor(bounds.top / this.cellSize);
    const maxY = Math.floor(bounds.bottom / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.add(`${x},${y}`);
      }
    }
    return cells;
  }

  // Get bounding box for a shape
  _getBounds(shape) {
    if (shape.type === 'text') {
      const text = shape.text || '';
      const fontSize = shape.fontSize || 16;
      const textWidth = text.length * fontSize * 0.6;
      const textHeight = fontSize;
      return {
        left: shape.x,
        right: shape.x + textWidth,
        top: shape.y,
        bottom: shape.y + textHeight
      };
    } else if (shape.type === 'path') {
      if (!shape.points || shape.points.length === 0) return null;
      const xs = shape.points.map(p => p.x);
      const ys = shape.points.map(p => p.y);
      return {
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys)
      };
    } else {
      const width = Math.abs(shape.width || 50);
      const height = Math.abs(shape.height || 50);
      return {
        left: shape.x,
        right: shape.x + width,
        top: shape.y,
        bottom: shape.y + height
      };
    }
  }

  // Add shape to index
  add(shape) {
    const bounds = this._getBounds(shape);
    if (!bounds) return;

    const cells = this._getCellsForBounds(bounds);
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey).add(shape.id);
    });
  }

  // Remove shape from index
  remove(shapeId) {
    this.grid.forEach((shapeIds, cellKey) => {
      shapeIds.delete(shapeId);
      if (shapeIds.size === 0) {
        this.grid.delete(cellKey);
      }
    });
  }

  // Update shape in index (remove and re-add)
  update(shape) {
    this.remove(shape.id);
    this.add(shape);
  }

  // Query shapes in a bounding box
  query(bounds) {
    const candidateIds = new Set();
    const cells = this._getCellsForBounds(bounds);
    
    cells.forEach(cellKey => {
      const shapeIds = this.grid.get(cellKey);
      if (shapeIds) {
        shapeIds.forEach(id => candidateIds.add(id));
      }
    });

    return candidateIds;
  }

  // Clear entire index
  clear() {
    this.grid.clear();
  }

  // Rebuild index from shapes array
  rebuild(shapes) {
    this.clear();
    shapes.forEach(shape => this.add(shape));
  }
}

// Rendering Engine with viewport culling and optimization
class RenderingEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true, // Better performance
      willReadFrequently: false
    });
    this.spatialIndex = new SpatialIndex(options.cellSize || 100);
    this.dirtyRegions = new Set();
    this.lastViewport = null;
    this.renderingQueue = [];
    this.isRendering = false;
    
    // Enable hardware acceleration hints
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  // Update shapes and rebuild spatial index
  updateShapes(shapes) {
    this.shapes = shapes;
    this.spatialIndex.rebuild(shapes);
    this.markDirty();
  }

  // Mark entire canvas as dirty
  markDirty() {
    this.dirtyRegions.clear();
    this.dirtyRegions.add('full');
  }

  // Get current viewport bounds
  getViewport(zoom, pan, canvasWidth, canvasHeight) {
    return {
      left: -pan.x / zoom,
      top: -pan.y / zoom,
      right: (canvasWidth - pan.x) / zoom,
      bottom: (canvasHeight - pan.y) / zoom,
      width: canvasWidth / zoom,
      height: canvasHeight / zoom
    };
  }

  // Get shapes visible in viewport (viewport culling)
  getVisibleShapes(viewport) {
    if (!this.shapes) return [];
    
    const viewportBounds = {
      left: viewport.left - 100, // Add padding for shapes partially visible
      right: viewport.right + 100,
      top: viewport.top - 100,
      bottom: viewport.bottom + 100
    };

    const candidateIds = this.spatialIndex.query(viewportBounds);
    return this.shapes.filter(s => candidateIds.has(s.id));
  }

  // Draw a single shape
  drawShape(ctx, shape, zoom, isSelected = false, isLocked = false) {
    ctx.save();
    
    if (shape.type === 'text') {
      ctx.fillStyle = shape.color || '#FFFFFF';
      ctx.font = `${shape.fontSize || 16}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      const textContent = shape.text || '';
      if (textContent) {
        ctx.fillText(textContent, shape.x, shape.y);
      }
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
    } else if (shape.type === 'path') {
      if (shape.points && shape.points.length > 0) {
        ctx.strokeStyle = shape.color || '#3B82F6';
        ctx.lineWidth = shape.strokeWidth || 2;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.stroke();
      }
    } else {
      // Geometric shapes
      ctx.strokeStyle = shape.color || '#3B82F6';
      ctx.fillStyle = shape.fillColor || 'transparent';
      ctx.lineWidth = shape.strokeWidth || 2;
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
      }
      
      ctx.stroke();
      if (shape.fillColor) ctx.fill();
    }

    // Draw lock overlay
    if (isLocked) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      const width = Math.abs(shape.width || 100);
      const height = Math.abs(shape.height || 100);
      ctx.fillRect(shape.x - 2, shape.y - 2, width + 4, height + 4);
      ctx.fillStyle = '#000';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', shape.x + width / 2, shape.y + height / 2);
    }

    // Draw selection outline
    if (isSelected && !isLocked) {
      const shapeWidth = Math.abs(shape.width || 100);
      const shapeHeight = Math.abs(shape.height || 100);
      const padding = 5 / zoom;
      
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(shape.x - padding, shape.y - padding, shapeWidth + 2 * padding, shapeHeight + 2 * padding);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // Render the canvas
  render(options = {}) {
    const {
      shapes = [],
      selectedShape = null,
      selectedShapes = new Set(),
      zoom = 1,
      pan = { x: 0, y: 0 },
      boardBackground = '#111827',
      lockedShapes = new Set(),
      drawPath = [],
      isDrawing = false,
      color = '#3B82F6',
      strokeWidth = 2,
      selectionBox = null,
      connectorStart = null,
      cursorPosition = { x: 0, y: 0 },
      tool = 'select',
      gridSize = 20,
      showGrid = true
    } = options;

    const canvas = this.canvas;
    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = boardBackground;
    ctx.fillRect(0, 0, width, height);

    // Apply transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Get viewport for culling
    const viewport = this.getViewport(zoom, pan, width, height);
    
    // Get visible shapes only (viewport culling)
    const visibleShapes = this.getVisibleShapes(viewport);

    // Draw grid
    if (showGrid) {
      const isLightBackground = boardBackground === '#FFFFFF' || boardBackground === '#F3F4F6';
      const gridColor = isLightBackground ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5 / zoom;
      
      const startX = Math.floor(viewport.left / gridSize) * gridSize;
      const startY = Math.floor(viewport.top / gridSize) * gridSize;
      const endX = Math.ceil(viewport.right / gridSize) * gridSize;
      const endY = Math.ceil(viewport.bottom / gridSize) * gridSize;

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
    }

    // Draw visible shapes only
    visibleShapes.forEach(shape => {
      const isSelected = selectedShape === shape.id || selectedShapes.has(shape.id);
      const isLocked = lockedShapes.has(shape.id);
      this.drawShape(ctx, shape, zoom, isSelected, isLocked);
    });

    // Draw current drawing path
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
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(connectorStart.x, connectorStart.y);
      ctx.lineTo(cursorPosition.x, cursorPosition.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw selection box
    if (selectionBox && selectionBox.width > 0 && selectionBox.height > 0) {
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // Hit test using spatial index
  hitTest(x, y, shapes, options = {}) {
    const { radius = 10, excludeLocked = false, lockedShapes = new Set() } = options;
    
    const bounds = {
      left: x - radius,
      right: x + radius,
      top: y - radius,
      bottom: y + radius
    };

    const candidateIds = this.spatialIndex.query(bounds);
    const candidates = shapes.filter(s => candidateIds.has(s.id));

    // Test candidates from top to bottom (reverse order)
    for (let i = candidates.length - 1; i >= 0; i--) {
      const shape = candidates[i];
      
      if (excludeLocked && lockedShapes.has(shape.id)) continue;

      if (shape.type === 'text') {
        const text = shape.text || '';
        const fontSize = shape.fontSize || 16;
        const textWidth = text.length * fontSize * 0.6;
        const textHeight = fontSize;
        if (x >= shape.x && x <= shape.x + textWidth && 
            y >= shape.y && y <= shape.y + textHeight) {
          return shape;
        }
      } else if (shape.type === 'sticky' || shape.type === 'image') {
        if (x >= shape.x && x <= shape.x + (shape.width || 200) && 
            y >= shape.y && y <= shape.y + (shape.height || 150)) {
          return shape;
        }
      } else if (shape.type === 'path') {
        if (shape.points && shape.points.length > 0) {
          const hit = shape.points.some(point => 
            Math.abs(x - point.x) < radius && Math.abs(y - point.y) < radius
          );
          if (hit) return shape;
        }
      } else {
        const width = Math.abs(shape.width || 50);
        const height = Math.abs(shape.height || 50);
        if (x >= shape.x && x <= shape.x + width && 
            y >= shape.y && y <= shape.y + height) {
          return shape;
        }
      }
    }

    return null;
  }

  // Cleanup
  destroy() {
    this.spatialIndex.clear();
    this.dirtyRegions.clear();
    this.renderingQueue = [];
  }
}

export { RenderingEngine, SpatialIndex };
