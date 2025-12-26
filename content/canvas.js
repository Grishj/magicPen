// Magic Pen - Canvas Drawing System
// Main content script for drawing overlay

(function () {
    'use strict';

    // Prevent multiple injections
    if (window.epicPenInitialized) return;
    window.epicPenInitialized = true;

    class MagicPenCanvas {
        constructor() {
            this.isEnabled = false;
            this.isDrawing = false;
            this.currentTool = 'pen';
            this.currentColor = '#FF0000';
            this.strokeSize = 4;
            this.strokes = [];
            this.redoStack = [];
            this.currentStroke = null;
            this.startPoint = null;
            this.activeTextInput = null;

            // Selection state
            this.selectedStroke = null;
            this.selectedStrokeIndex = -1;
            this.isDragging = false;
            this.dragOffset = { x: 0, y: 0 };

            this.canvas = null;
            this.ctx = null;
            this.container = null;

            this.init();
        }

        init() {
            this.createCanvas();
            this.setupEventListeners();
            this.loadState();
            this.listenForStorageChanges();
            console.log('[MagicPen] Canvas initialized');
        }

        createCanvas() {
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'epic-pen-container';
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 2147483646;
                display: none;
                overflow: hidden;
            `;

            // Create canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'epic-pen-canvas';
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                cursor: crosshair;
            `;

            this.container.appendChild(this.canvas);
            document.body.appendChild(this.container);

            // Set canvas resolution
            this.resizeCanvas();

            // Get context
            this.ctx = this.canvas.getContext('2d');
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            // Handle window resize
            window.addEventListener('resize', () => this.resizeCanvas());
            window.addEventListener('scroll', () => this.handleScroll());
        }

        resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;

            // Get full document dimensions
            const docWidth = Math.max(
                document.documentElement.scrollWidth,
                document.body.scrollWidth,
                window.innerWidth
            );
            const docHeight = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight,
                window.innerHeight
            );

            // Set canvas size to cover full document
            this.canvas.width = docWidth * dpr;
            this.canvas.height = docHeight * dpr;
            this.canvas.style.width = `${docWidth}px`;
            this.canvas.style.height = `${docHeight}px`;

            if (this.ctx) {
                this.ctx.scale(dpr, dpr);
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.redrawAll();
            }
        }

        handleScroll() {
            // Move canvas to follow scroll so drawings stay in document position
            this.canvas.style.transform = `translate(${-window.scrollX}px, ${-window.scrollY}px)`;
        }

        setupEventListeners() {
            // Drawing events on canvas
            this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

            // Touch support
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

            // Listen for messages from popup/background
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('[MagicPen] Received message:', message);
                this.handleMessage(message);
                sendResponse({ success: true });
                return true;
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }

        // Listen for storage changes to sync state
        listenForStorageChanges() {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local' && changes.epicPenState) {
                    const newState = changes.epicPenState.newValue;
                    console.log('[MagicPen] Storage changed:', newState);

                    if (newState) {
                        // Sync enabled state
                        if (newState.isEnabled !== undefined && newState.isEnabled !== this.isEnabled) {
                            this.toggleDrawing(newState.isEnabled);
                        }
                        // Sync tool
                        if (newState.currentTool) {
                            this.currentTool = newState.currentTool;
                            this.updateCursor();
                            // Deselect when switching tools
                            if (newState.currentTool !== 'select') {
                                this.deselectStroke();
                            }
                        }
                        // Sync color
                        if (newState.currentColor) {
                            this.currentColor = newState.currentColor;
                        }
                        // Sync stroke size
                        if (newState.strokeSize) {
                            this.strokeSize = newState.strokeSize;
                        }
                    }
                }
            });
        }

        handleMessage(message) {
            switch (message.action) {
                case 'toggleDrawing':
                    this.toggleDrawing(message.enabled);
                    break;
                case 'setTool':
                    this.setTool(message.tool);
                    break;
                case 'setColor':
                    this.setColor(message.color);
                    break;
                case 'setStrokeSize':
                    this.setStrokeSize(message.size);
                    break;
                case 'undo':
                    this.undo();
                    break;
                case 'redo':
                    this.redo();
                    break;
                case 'clear':
                    this.clearAll();
                    break;
                case 'getState':
                    return {
                        isEnabled: this.isEnabled,
                        currentTool: this.currentTool,
                        currentColor: this.currentColor,
                        strokeSize: this.strokeSize
                    };
            }
        }

        handleKeyDown(e) {
            // Handle text input separately
            if (this.activeTextInput) {
                if (e.key === 'Escape') {
                    this.cancelTextInput();
                }
                return;
            }

            // Only handle if drawing mode is enabled
            if (!this.isEnabled) return;

            // Delete selected stroke
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedStroke) {
                e.preventDefault();
                this.deleteSelectedStroke();
            }

            // Escape to deselect or disable
            if (e.key === 'Escape') {
                if (this.selectedStroke) {
                    this.deselectStroke();
                } else {
                    this.toggleDrawing(false);
                    this.saveState();
                }
            }

            // Ctrl+Z for undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Shift+Z or Ctrl+Y for redo
            if ((e.ctrlKey && e.key === 'z' && e.shiftKey) || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
        }

        toggleDrawing(enabled) {
            console.log('[MagicPen] Toggle drawing:', enabled);
            this.isEnabled = enabled;
            this.container.style.display = enabled ? 'block' : 'none';
            this.canvas.style.pointerEvents = enabled ? 'auto' : 'none';

            if (enabled) {
                this.resizeCanvas();
                this.handleScroll();
            } else {
                this.deselectStroke();
            }

            this.updateCursor();
        }

        setTool(tool) {
            console.log('[MagicPen] Set tool:', tool);
            this.currentTool = tool;
            this.updateCursor();

            // Deselect when switching away from select tool
            if (tool !== 'select') {
                this.deselectStroke();
            }
        }

        setColor(color) {
            this.currentColor = color;

            // Update selected stroke color
            if (this.selectedStroke) {
                this.selectedStroke.color = color;
                this.redrawAll();
            }
        }

        setStrokeSize(size) {
            this.strokeSize = size;

            // Update selected stroke size
            if (this.selectedStroke) {
                this.selectedStroke.size = size;
                this.redrawAll();
            }
        }

        updateCursor() {
            if (!this.isEnabled) return;

            switch (this.currentTool) {
                case 'select':
                    this.canvas.style.cursor = 'default';
                    break;
                case 'eraser':
                    this.canvas.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2\'%3E%3Cpath d=\'M20 20H7L3 16c-.8-.8-.8-2 0-2.8l10-10c.8-.8 2-.8 2.8 0l6 6c.8.8.8 2 0 2.8L12 22\'/%3E%3C/svg%3E") 12 12, crosshair';
                    break;
                case 'text':
                    this.canvas.style.cursor = 'text';
                    break;
                default:
                    this.canvas.style.cursor = 'crosshair';
            }
        }

        // Mouse event handlers
        handleMouseDown(e) {
            if (!this.isEnabled) return;

            const point = this.getPoint(e);

            if (this.currentTool === 'select') {
                this.handleSelectionStart(point);
            } else {
                this.startDrawing(point);
            }
        }

        handleMouseMove(e) {
            if (!this.isEnabled) return;

            const point = this.getPoint(e);

            if (this.currentTool === 'select') {
                if (this.isDragging && this.selectedStroke) {
                    this.handleDrag(point);
                }
            } else if (this.isDrawing) {
                this.continueDrawing(point);
            }
        }

        handleMouseUp(e) {
            if (!this.isEnabled) return;

            const point = this.getPoint(e);

            if (this.currentTool === 'select') {
                this.handleSelectionEnd(point);
            } else if (this.isDrawing) {
                this.endDrawing(point);
            }
        }

        // Touch event handlers
        handleTouchStart(e) {
            if (!this.isEnabled) return;
            e.preventDefault();

            const touch = e.touches[0];
            const point = this.getPointFromTouch(touch);

            if (this.currentTool === 'select') {
                this.handleSelectionStart(point);
            } else {
                this.startDrawing(point);
            }
        }

        handleTouchMove(e) {
            if (!this.isEnabled) return;
            e.preventDefault();

            const touch = e.touches[0];
            const point = this.getPointFromTouch(touch);

            if (this.currentTool === 'select') {
                if (this.isDragging && this.selectedStroke) {
                    this.handleDrag(point);
                }
            } else if (this.isDrawing) {
                this.continueDrawing(point);
            }
        }

        handleTouchEnd(e) {
            if (!this.isEnabled) return;

            if (this.currentTool === 'select') {
                this.handleSelectionEnd(null);
            } else if (this.isDrawing) {
                this.endDrawing(this.currentStroke?.points?.slice(-1)[0] || this.startPoint);
            }
        }

        // Selection and Move functionality
        handleSelectionStart(point) {
            // Check if clicking on already selected stroke to drag
            if (this.selectedStroke && this.isPointNearStroke(point, this.selectedStroke, 20)) {
                this.isDragging = true;
                this.dragOffset = {
                    x: point.x,
                    y: point.y
                };
                this.canvas.style.cursor = 'grabbing';
                return;
            }

            // Try to select a stroke
            const hitStroke = this.findStrokeAtPoint(point);

            if (hitStroke) {
                this.selectedStroke = hitStroke.stroke;
                this.selectedStrokeIndex = hitStroke.index;
                this.isDragging = true;
                this.dragOffset = {
                    x: point.x,
                    y: point.y
                };
                this.canvas.style.cursor = 'grabbing';
                this.redrawAll();
            } else {
                this.deselectStroke();
            }
        }

        handleDrag(point) {
            if (!this.isDragging || !this.selectedStroke) return;

            const dx = point.x - this.dragOffset.x;
            const dy = point.y - this.dragOffset.y;

            // Move the stroke
            this.moveStroke(this.selectedStroke, dx, dy);

            // Update drag offset
            this.dragOffset = { x: point.x, y: point.y };

            this.redrawAll();
        }

        handleSelectionEnd(point) {
            this.isDragging = false;
            if (this.currentTool === 'select') {
                this.canvas.style.cursor = this.selectedStroke ? 'move' : 'default';
            }
        }

        moveStroke(stroke, dx, dy) {
            if (stroke.tool === 'text') {
                stroke.point.x += dx;
                stroke.point.y += dy;
            } else if (this.isShapeTool(stroke.tool)) {
                stroke.startPoint.x += dx;
                stroke.startPoint.y += dy;
                stroke.endPoint.x += dx;
                stroke.endPoint.y += dy;
            } else {
                // Freehand stroke (pen, highlighter)
                stroke.points.forEach(p => {
                    p.x += dx;
                    p.y += dy;
                });
            }
        }

        findStrokeAtPoint(point) {
            // Search from top (last drawn) to bottom (first drawn)
            for (let i = this.strokes.length - 1; i >= 0; i--) {
                const stroke = this.strokes[i];
                if (this.isPointNearStroke(point, stroke, 15)) {
                    return { stroke, index: i };
                }
            }
            return null;
        }

        isPointNearStroke(point, stroke, threshold) {
            if (stroke.tool === 'text') {
                // Text hit detection - check bounding box
                const textWidth = this.ctx.measureText(stroke.text).width || stroke.text.length * stroke.size * 2;
                const textHeight = stroke.size * 4;
                return point.x >= stroke.point.x - 10 &&
                    point.x <= stroke.point.x + textWidth + 10 &&
                    point.y >= stroke.point.y - textHeight &&
                    point.y <= stroke.point.y + 10;
            } else if (this.isShapeTool(stroke.tool)) {
                return this.isNearShape(point, stroke, threshold);
            } else {
                // Freehand stroke
                return stroke.points.some(p => this.distance(p, point) < threshold);
            }
        }

        deselectStroke() {
            this.selectedStroke = null;
            this.selectedStrokeIndex = -1;
            this.isDragging = false;
            this.redrawAll();
        }

        deleteSelectedStroke() {
            if (this.selectedStroke && this.selectedStrokeIndex >= 0) {
                this.strokes.splice(this.selectedStrokeIndex, 1);
                this.deselectStroke();
            }
        }

        // Get point in document coordinates
        getPoint(e) {
            return {
                x: e.clientX + window.scrollX,
                y: e.clientY + window.scrollY
            };
        }

        getPointFromTouch(touch) {
            return {
                x: touch.clientX + window.scrollX,
                y: touch.clientY + window.scrollY
            };
        }

        // Drawing operations
        startDrawing(point) {
            this.isDrawing = true;
            this.startPoint = point;
            this.redoStack = [];

            if (this.currentTool === 'eraser') {
                this.eraseAt(point);
                return;
            }

            if (this.currentTool === 'text') {
                this.createTextInput(point);
                this.isDrawing = false;
                return;
            }

            // Create new stroke
            this.currentStroke = {
                tool: this.currentTool,
                color: this.currentColor,
                size: this.strokeSize,
                points: [point],
                startPoint: point
            };

            // For shapes, we don't draw until mouse up
            if (!this.isShapeTool(this.currentTool)) {
                this.drawStroke(this.currentStroke);
            }
        }

        continueDrawing(point) {
            if (this.currentTool === 'eraser') {
                this.eraseAt(point);
                return;
            }

            if (this.isShapeTool(this.currentTool)) {
                this.redrawAll();
                this.drawShapePreview(this.startPoint, point);
            } else {
                this.currentStroke.points.push(point);
                const points = this.currentStroke.points;
                const prevPoint = points[points.length - 2];
                this.drawLine(prevPoint, point, this.currentStroke);
            }
        }

        endDrawing(point) {
            this.isDrawing = false;

            if (this.currentTool === 'eraser') {
                return;
            }

            if (this.isShapeTool(this.currentTool)) {
                this.currentStroke.endPoint = point;
                this.strokes.push(this.currentStroke);
                this.redrawAll();
            } else if (this.currentStroke && this.currentStroke.points.length > 0) {
                this.strokes.push(this.currentStroke);
            }

            this.currentStroke = null;
            this.startPoint = null;
        }

        isShapeTool(tool) {
            return ['line', 'rectangle', 'circle', 'arrow'].includes(tool);
        }

        drawStroke(stroke) {
            if (stroke.points.length < 2) return;

            this.ctx.beginPath();
            this.ctx.strokeStyle = stroke.color;
            this.ctx.lineWidth = stroke.size;
            this.ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.4 : 1;

            this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

            for (let i = 1; i < stroke.points.length; i++) {
                this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }

            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }

        drawLine(from, to, stroke) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = stroke.color;
            this.ctx.lineWidth = stroke.size;
            this.ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.4 : 1;

            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }

        drawShapePreview(start, end) {
            this.drawShape(start, end, {
                tool: this.currentTool,
                color: this.currentColor,
                size: this.strokeSize
            });
        }

        drawShape(start, end, stroke) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = stroke.color;
            this.ctx.lineWidth = stroke.size;

            switch (stroke.tool) {
                case 'line':
                    this.ctx.moveTo(start.x, start.y);
                    this.ctx.lineTo(end.x, end.y);
                    break;

                case 'rectangle':
                    const width = end.x - start.x;
                    const height = end.y - start.y;
                    this.ctx.strokeRect(start.x, start.y, width, height);
                    return;

                case 'circle':
                    const radiusX = Math.abs(end.x - start.x) / 2;
                    const radiusY = Math.abs(end.y - start.y) / 2;
                    const centerX = start.x + (end.x - start.x) / 2;
                    const centerY = start.y + (end.y - start.y) / 2;
                    this.ctx.beginPath();
                    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                    break;

                case 'arrow':
                    this.ctx.moveTo(start.x, start.y);
                    this.ctx.lineTo(end.x, end.y);
                    this.ctx.stroke();

                    const angle = Math.atan2(end.y - start.y, end.x - start.x);
                    const headLength = 15 + stroke.size;

                    this.ctx.beginPath();
                    this.ctx.moveTo(end.x, end.y);
                    this.ctx.lineTo(
                        end.x - headLength * Math.cos(angle - Math.PI / 6),
                        end.y - headLength * Math.sin(angle - Math.PI / 6)
                    );
                    this.ctx.moveTo(end.x, end.y);
                    this.ctx.lineTo(
                        end.x - headLength * Math.cos(angle + Math.PI / 6),
                        end.y - headLength * Math.sin(angle + Math.PI / 6)
                    );
                    break;
            }

            this.ctx.stroke();
        }

        eraseAt(point) {
            const eraserRadius = this.strokeSize * 3;
            const originalLength = this.strokes.length;

            this.strokes = this.strokes.filter(stroke => {
                if (stroke.tool === 'text') {
                    return this.distance(stroke.point, point) >= eraserRadius;
                }
                if (this.isShapeTool(stroke.tool)) {
                    return !this.isNearShape(point, stroke, eraserRadius);
                }
                return !stroke.points.some(p => this.distance(p, point) < eraserRadius);
            });

            if (this.strokes.length !== originalLength) {
                this.redrawAll();
            }
        }

        isNearShape(point, stroke, radius) {
            const start = stroke.startPoint;
            const end = stroke.endPoint;

            if (!start || !end) return false;

            switch (stroke.tool) {
                case 'line':
                case 'arrow':
                    return this.distanceToLine(point, start, end) < radius;
                case 'rectangle':
                    return this.isNearRectangle(point, start, end, radius);
                case 'circle':
                    return this.isNearEllipse(point, start, end, radius);
                default:
                    return false;
            }
        }

        distance(p1, p2) {
            return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        }

        distanceToLine(point, lineStart, lineEnd) {
            const A = point.x - lineStart.x;
            const B = point.y - lineStart.y;
            const C = lineEnd.x - lineStart.x;
            const D = lineEnd.y - lineStart.y;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;

            if (lenSq !== 0) param = dot / lenSq;

            let xx, yy;

            if (param < 0) {
                xx = lineStart.x;
                yy = lineStart.y;
            } else if (param > 1) {
                xx = lineEnd.x;
                yy = lineEnd.y;
            } else {
                xx = lineStart.x + param * C;
                yy = lineStart.y + param * D;
            }

            return this.distance(point, { x: xx, y: yy });
        }

        isNearRectangle(point, start, end, radius) {
            const minX = Math.min(start.x, end.x);
            const maxX = Math.max(start.x, end.x);
            const minY = Math.min(start.y, end.y);
            const maxY = Math.max(start.y, end.y);

            const edges = [
                [{ x: minX, y: minY }, { x: maxX, y: minY }],
                [{ x: maxX, y: minY }, { x: maxX, y: maxY }],
                [{ x: maxX, y: maxY }, { x: minX, y: maxY }],
                [{ x: minX, y: maxY }, { x: minX, y: minY }]
            ];

            return edges.some(([a, b]) => this.distanceToLine(point, a, b) < radius);
        }

        isNearEllipse(point, start, end, radius) {
            const centerX = (start.x + end.x) / 2;
            const centerY = (start.y + end.y) / 2;
            const radiusX = Math.abs(end.x - start.x) / 2;
            const radiusY = Math.abs(end.y - start.y) / 2;

            if (radiusX === 0 || radiusY === 0) return false;

            const normalizedDist = Math.pow((point.x - centerX) / radiusX, 2) +
                Math.pow((point.y - centerY) / radiusY, 2);

            return Math.abs(normalizedDist - 1) < radius / Math.min(radiusX, radiusY);
        }

        // Text input
        createTextInput(point) {
            this.cancelTextInput();

            const viewportX = point.x - window.scrollX;
            const viewportY = point.y - window.scrollY;

            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'epic-pen-text-input';
            input.style.cssText = `
                position: fixed;
                left: ${viewportX}px;
                top: ${viewportY - 20}px;
                z-index: 2147483647;
                padding: 8px 12px;
                font-family: Arial, sans-serif;
                font-size: ${this.strokeSize * 4}px;
                color: ${this.currentColor};
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid ${this.currentColor};
                border-radius: 4px;
                outline: none;
                min-width: 150px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                pointer-events: auto;
            `;
            input.placeholder = 'Type here, press Enter...';

            this.activeTextInput = input;
            this.textInputPoint = point;

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.confirmTextInput();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelTextInput();
                }
                e.stopPropagation();
            });

            // Prevent clicks from propagating to canvas while typing
            input.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });

            input.addEventListener('blur', (e) => {
                // Save the text value immediately before any async operations
                const textValue = input.value.trim();
                const point = this.textInputPoint;
                const color = this.currentColor;
                const size = this.strokeSize;

                // Use a flag to prevent re-entry
                if (this.isConfirmingText) return;
                this.isConfirmingText = true;

                // Small delay to allow click events to be processed first
                setTimeout(() => {
                    // Only proceed if input still exists (wasn't cancelled)
                    if (this.activeTextInput && textValue) {
                        const stroke = {
                            tool: 'text',
                            color: color,
                            size: size,
                            text: textValue,
                            point: point
                        };
                        this.strokes.push(stroke);
                        this.redrawAll();
                    }

                    // Clean up
                    if (this.activeTextInput && this.activeTextInput.parentNode) {
                        this.activeTextInput.parentNode.removeChild(this.activeTextInput);
                    }
                    this.activeTextInput = null;
                    this.textInputPoint = null;
                    this.isConfirmingText = false;
                }, 50);
            });

            document.body.appendChild(input);
            setTimeout(() => input.focus(), 50);
        }

        confirmTextInput() {
            if (!this.activeTextInput || this.isConfirmingText) return;
            this.isConfirmingText = true;

            const text = this.activeTextInput.value.trim();
            if (text) {
                const stroke = {
                    tool: 'text',
                    color: this.currentColor,
                    size: this.strokeSize,
                    text: text,
                    point: this.textInputPoint
                };
                this.strokes.push(stroke);
                this.redrawAll();
            }

            // Clean up
            if (this.activeTextInput && this.activeTextInput.parentNode) {
                this.activeTextInput.parentNode.removeChild(this.activeTextInput);
            }
            this.activeTextInput = null;
            this.textInputPoint = null;
            this.isConfirmingText = false;
        }

        cancelTextInput() {
            this.isConfirmingText = false;
            if (this.activeTextInput && this.activeTextInput.parentNode) {
                this.activeTextInput.parentNode.removeChild(this.activeTextInput);
            }
            this.activeTextInput = null;
            this.textInputPoint = null;
        }

        drawText(stroke) {
            this.ctx.font = `${stroke.size * 4}px Arial, sans-serif`;
            this.ctx.fillStyle = stroke.color;
            this.ctx.fillText(stroke.text, stroke.point.x, stroke.point.y);
        }

        // Draw selection highlight with dynamic color based on background
        drawSelectionHighlight(stroke) {
            this.ctx.save();

            // Get dynamic selection color based on page background
            const selectionColor = this.getContrastingColor();

            this.ctx.strokeStyle = selectionColor;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);

            const bounds = this.getStrokeBounds(stroke);
            const padding = 8;

            this.ctx.strokeRect(
                bounds.minX - padding,
                bounds.minY - padding,
                bounds.maxX - bounds.minX + padding * 2,
                bounds.maxY - bounds.minY + padding * 2
            );

            this.ctx.restore();
        }

        // Get a contrasting color based on page background
        getContrastingColor() {
            try {
                // Get background color from body or html
                const bodyBg = window.getComputedStyle(document.body).backgroundColor;
                const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;

                // Use body background if set, otherwise html, otherwise assume white
                let bgColor = bodyBg;
                if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
                    bgColor = htmlBg;
                }
                if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
                    bgColor = 'rgb(255, 255, 255)'; // Default to white
                }

                // Parse RGB values
                const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (rgbMatch) {
                    const r = parseInt(rgbMatch[1]);
                    const g = parseInt(rgbMatch[2]);
                    const b = parseInt(rgbMatch[3]);

                    // Calculate luminance (perceived brightness)
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

                    // Return white for dark backgrounds, dark blue for light backgrounds
                    return luminance < 128 ? '#FFFFFF' : '#0066CC';
                }
            } catch (e) {
                console.log('[MagicPen] Error detecting background:', e);
            }

            // Default to blue
            return '#0066CC';
        }

        getStrokeBounds(stroke) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            if (stroke.tool === 'text') {
                const textWidth = stroke.text.length * stroke.size * 2.5;
                const textHeight = stroke.size * 4;
                minX = stroke.point.x;
                maxX = stroke.point.x + textWidth;
                minY = stroke.point.y - textHeight;
                maxY = stroke.point.y;
            } else if (this.isShapeTool(stroke.tool)) {
                minX = Math.min(stroke.startPoint.x, stroke.endPoint.x);
                maxX = Math.max(stroke.startPoint.x, stroke.endPoint.x);
                minY = Math.min(stroke.startPoint.y, stroke.endPoint.y);
                maxY = Math.max(stroke.startPoint.y, stroke.endPoint.y);
            } else {
                stroke.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y);
                    maxY = Math.max(maxY, p.y);
                });
            }

            return { minX, minY, maxX, maxY };
        }

        redrawAll() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.strokes.forEach(stroke => {
                if (stroke.tool === 'text') {
                    this.drawText(stroke);
                } else if (this.isShapeTool(stroke.tool)) {
                    this.drawShape(stroke.startPoint, stroke.endPoint, stroke);
                } else {
                    this.drawStroke(stroke);
                }
            });

            // Draw selection highlight
            if (this.selectedStroke) {
                this.drawSelectionHighlight(this.selectedStroke);
            }
        }

        undo() {
            if (this.strokes.length > 0) {
                const stroke = this.strokes.pop();
                this.redoStack.push(stroke);
                this.deselectStroke();
                this.redrawAll();
            }
        }

        redo() {
            if (this.redoStack.length > 0) {
                const stroke = this.redoStack.pop();
                this.strokes.push(stroke);
                this.redrawAll();
            }
        }

        clearAll() {
            if (this.strokes.length > 0) {
                this.redoStack = [...this.strokes];
                this.strokes = [];
                this.deselectStroke();
                this.redrawAll();
            }
        }

        async loadState() {
            try {
                const result = await chrome.storage.local.get(['epicPenState']);
                if (result.epicPenState) {
                    this.currentTool = result.epicPenState.currentTool || 'pen';
                    this.currentColor = result.epicPenState.currentColor || '#FF0000';
                    this.strokeSize = result.epicPenState.strokeSize || 4;

                    if (result.epicPenState.isEnabled) {
                        this.toggleDrawing(true);
                    }
                }
                console.log('[MagicPen] State loaded:', result.epicPenState);
            } catch (error) {
                console.error('[MagicPen] Error loading state:', error);
            }
        }

        async saveState() {
            try {
                await chrome.storage.local.set({
                    epicPenState: {
                        currentTool: this.currentTool,
                        currentColor: this.currentColor,
                        strokeSize: this.strokeSize,
                        isEnabled: this.isEnabled
                    }
                });
            } catch (error) {
                console.error('[MagicPen] Error saving state:', error);
            }
        }
    }

    // Initialize Magic Pen
    window.epicPen = new MagicPenCanvas();
    console.log('[MagicPen] Extension loaded');
})();
