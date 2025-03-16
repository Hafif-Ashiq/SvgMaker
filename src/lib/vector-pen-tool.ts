import { Canvas, Path, TPointerEvent, TPointerEventInfo, Circle, Line } from 'fabric';

type AnchorPoint = {
    x: number;
    y: number;
    controlIn?: { x: number; y: number };
    controlOut?: { x: number; y: number };
    visual?: Circle; // Visual representation of the anchor point
    lineToNext?: Line; // Line connecting to the next point
};

export class VectorPenTool {
    private canvas: Canvas;
    private active = false;
    // private currentPath: Path | null = null;
    private anchorPoints: AnchorPoint[] = [];
    private isDragging = false;
    private lastClickTime = 0;
    private selectedAnchorIndex: number = -1;
    private editMode = false;
    // private activeTool: Path | null = null; // For visual feedback
    private currentMousePosition: { x: number, y: number } = { x: 0, y: 0 };
    private previewLine: Line | null = null; // Line from last point to cursor
    private controlPoints: { visual: Circle, segmentIndex: number }[] = []; // Track control points

    constructor(canvas: Canvas) {
        this.canvas = canvas;
        this.setupEvents();
    }

    private setupEvents() {
        this.canvas.on('mouse:down', this.handleMouseDown);
        this.canvas.on('mouse:move', this.handleMouseMove);
        this.canvas.on('mouse:up', this.handleMouseUp);
    }

    public activate() {
        this.active = true;
        this.canvas.defaultCursor = 'crosshair';
        this.canvas.hoverCursor = 'crosshair';
        this.canvas.selection = false;
        this.editMode = false;

        // Add keyboard event listener to window
        window.addEventListener('keydown', this.handleKeyDown);

        // Show visual feedback that tool is active
        console.log('Pen Tool activated - click to start drawing a path');

        // Debug info
        console.log('Instructions:');
        console.log('1. Click to add points and create straight line segments');
        console.log('2. Click and drag to create curved segments');
        console.log('3. Press "e" to toggle edit mode for adjusting points');
        console.log('4. Double-click to close and finalize the path');

        // Disable any active selection
        this.canvas.discardActiveObject();
        this.canvas.renderAll();

        return this;
    }

    public deactivate() {
        // Clean up any remaining visual elements
        this.clearAllVisualElements();

        // Finalize the path if we have enough points
        if (this.anchorPoints.length >= 2) {
            this.createFinalPath();
        }

        this.active = false;
        this.canvas.defaultCursor = 'default';
        this.canvas.hoverCursor = 'move';
        this.canvas.selection = true;
        this.cleanup();

        // Remove keyboard event listener
        window.removeEventListener('keydown', this.handleKeyDown);

        console.log('Pen Tool deactivated');
        return this;
    }

    private cleanup() {
        this.anchorPoints = [];
        // this.currentPath = null;
        this.isDragging = false;
        this.selectedAnchorIndex = -1;

        // Clean up all control points
        this.controlPoints.forEach(cp => {
            this.canvas.remove(cp.visual);
        });
        this.controlPoints = [];

        // Remove preview line if it exists
        if (this.previewLine) {
            this.canvas.remove(this.previewLine);
            this.previewLine = null;
        }
    }

    private clearAllVisualElements() {
        // Remove all anchor point visuals
        this.clearAnchorPointVisuals();

        // Remove all connecting lines
        this.anchorPoints.forEach(point => {
            if (point.lineToNext) {
                this.canvas.remove(point.lineToNext);
                point.lineToNext = undefined;
            }
        });

        // Remove all control points
        this.controlPoints.forEach(cp => {
            this.canvas.remove(cp.visual);
        });
        this.controlPoints = [];

        // Remove preview line
        if (this.previewLine) {
            this.canvas.remove(this.previewLine);
            this.previewLine = null;
        }
    }

    private handleMouseDown = (event: TPointerEventInfo<TPointerEvent>) => {
        if (!this.active) return;

        const pointer = this.canvas.getPointer(event.e);

        // Double click to close path
        const now = Date.now();
        const doubleClickDetected = now - this.lastClickTime < 300 && this.anchorPoints.length > 1;
        this.lastClickTime = now;

        if (doubleClickDetected) {
            this.closePath();
            return;
        }

        if (this.editMode) {
            // Check if we're clicking on an existing anchor point
            const anchorIndex = this.findAnchorPointAt(pointer.x, pointer.y);
            if (anchorIndex !== -1) {
                this.selectedAnchorIndex = anchorIndex;
                this.isDragging = true;

                // Disable selection to prevent selection box
                this.canvas.selection = false;
                return;
            }

            // Check if we're clicking on a path segment to add a new point
            const segmentIndex = this.findSegmentAt(pointer.x, pointer.y);
            if (segmentIndex !== -1) {
                this.addAnchorPointToSegment(segmentIndex, pointer.x, pointer.y);
                return;
            }

            // If we're in edit mode and didn't click on any existing element, just return
            return;
        }

        // At this point, we're in draw mode (not edit mode), so create a new point
        // Create a new anchor point
        const newPoint: AnchorPoint = {
            x: pointer.x,
            y: pointer.y,
        };

        // Add the point
        this.anchorPoints.push(newPoint);
        this.addAnchorPointVisual(newPoint);

        // If this is not the first point, create a line from the previous point
        if (this.anchorPoints.length > 1) {
            const prevPoint = this.anchorPoints[this.anchorPoints.length - 2];

            // Simply create a line without adding control points
            this.createLineBetweenPoints(prevPoint, newPoint);
        }

        // Debug: Check what we're trying to render
        console.log(`Adding point #${this.anchorPoints.length} at (${pointer.x}, ${pointer.y})`);

        // Set dragging state to enable curve creation if the user drags
        this.isDragging = true;

        // Force canvas render
        this.canvas.requestRenderAll();
    };

    private handleMouseMove = (event: TPointerEventInfo<TPointerEvent>) => {
        if (!this.active) return;

        const pointer = this.canvas.getPointer(event.e);

        // Track current mouse position for preview lines
        this.currentMousePosition = { x: pointer.x, y: pointer.y };

        // Update preview line if we have points
        this.updatePreviewLine();

        // Handle dragging behavior
        if (this.isDragging) {
            if (this.editMode && this.selectedAnchorIndex !== -1) {
                // Move selected anchor point
                const point = this.anchorPoints[this.selectedAnchorIndex];

                point.x = pointer.x;
                point.y = pointer.y;

                // Update the visual representation
                this.updateAnchorPointVisual(point);

                // Update the connecting lines
                this.updateLinesForPoint(this.selectedAnchorIndex);
            }
        }
    };

    private updatePreviewLine() {
        // Only show preview when not in edit mode and have at least one point
        if (this.editMode || this.anchorPoints.length === 0) {
            if (this.previewLine) {
                this.previewLine.set({ visible: false });
            }
            return;
        }

        const lastPoint = this.anchorPoints[this.anchorPoints.length - 1];

        // Create preview line if it doesn't exist
        if (!this.previewLine) {
            this.previewLine = new Line(
                [lastPoint.x, lastPoint.y, this.currentMousePosition.x, this.currentMousePosition.y],
                {
                    stroke: '#FF0000',
                    strokeWidth: 2,
                    strokeDashArray: [5, 5], // Make it dashed to indicate preview
                    selectable: false
                }
            );
            this.canvas.add(this.previewLine);
        } else {
            // Update existing preview line
            this.previewLine.set({
                x1: lastPoint.x,
                y1: lastPoint.y,
                x2: this.currentMousePosition.x,
                y2: this.currentMousePosition.y,
                visible: true
            });
        }

        this.canvas.requestRenderAll();
    }

    private createLineBetweenPoints(point1: AnchorPoint, point2: AnchorPoint) {
        // Create a line between two points
        //let linePoints;
        let linePath;

        if (point1.controlOut && point2.controlIn) {
            // Create a curved line when control points exist
            linePath = new Path(`M ${point1.x},${point1.y} C ${point1.controlOut.x},${point1.controlOut.y} ${point2.controlIn.x},${point2.controlIn.y} ${point2.x},${point2.y}`, {
                fill: 'transparent',
                stroke: '#FF0000',
                strokeWidth: 2,
                selectable: false
            });
            this.canvas.add(linePath);
            point1.lineToNext = linePath as unknown as Line; // Cast to Line for compatibility
        } else {
            // Create a straight line
            const line = new Line([point1.x, point1.y, point2.x, point2.y], {
                stroke: '#FF0000',
                strokeWidth: 2,
                selectable: false
            });

            // Add to canvas
            this.canvas.add(line);
            point1.lineToNext = line;
        }

        return point1.lineToNext;
    }

    private updateLinesForPoint(index: number) {
        const point = this.anchorPoints[index];

        // Update line from previous point to this point
        if (index > 0) {
            const prevPoint = this.anchorPoints[index - 1];
            if (prevPoint.lineToNext) {
                if (prevPoint.lineToNext instanceof Line) {
                    // Update straight line
                    prevPoint.lineToNext.set({
                        x2: point.x,
                        y2: point.y
                    });
                } else {
                    // Recreate curved line
                    this.canvas.remove(prevPoint.lineToNext);
                    this.createLineBetweenPoints(prevPoint, point);
                }
            }
        }

        // Update line from this point to next point
        if (point.lineToNext) {
            if (point.lineToNext instanceof Line) {
                // Update straight line
                point.lineToNext.set({
                    x1: point.x,
                    y1: point.y
                });
            } else {
                // Recreate curved line
                const nextIndex = index + 1;
                if (nextIndex < this.anchorPoints.length) {
                    const nextPoint = this.anchorPoints[nextIndex];
                    this.canvas.remove(point.lineToNext);
                    this.createLineBetweenPoints(point, nextPoint);
                }
            }
        }

        this.canvas.requestRenderAll();
    }

    private handleMouseUp = () => {
        this.isDragging = false;
        this.selectedAnchorIndex = -1;
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (!this.active) return;

        if (e.key === 'Escape') {
            this.deactivate();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.editMode && this.selectedAnchorIndex !== -1) {
                this.removeAnchorPoint(this.selectedAnchorIndex);
            }
        } else if (e.key === 'e') {
            this.toggleEditMode();
        }
    };

    private closePath() {
        if (this.anchorPoints.length < 3) {
            // Not enough points to close properly
            this.createFinalPath();

            // Clear anchor points to prevent duplicate path creation on deactivate
            this.anchorPoints = [];
            this.deactivate();
            return;
        }

        // Add a line from the last point to the first point
        const firstPoint = this.anchorPoints[0];
        const lastPoint = this.anchorPoints[this.anchorPoints.length - 1];

        // Add control points for a smooth closing curve
        const dx = firstPoint.x - lastPoint.x;
        const dy = firstPoint.y - lastPoint.y;

        lastPoint.controlOut = {
            x: lastPoint.x + dx / 3,
            y: lastPoint.y + dy / 3
        };

        firstPoint.controlIn = {
            x: firstPoint.x - dx / 3,
            y: firstPoint.y - dy / 3
        };

        this.createLineBetweenPoints(lastPoint, firstPoint);

        // Create final path
        this.createFinalPath(true);
    }

    private createFinalPath(closed = false) {
        if (this.anchorPoints.length < 2) return;

        try {
            // Build the path from points
            let pathData = `M ${this.anchorPoints[0].x},${this.anchorPoints[0].y}`;

            for (let i = 1; i < this.anchorPoints.length; i++) {
                const prev = this.anchorPoints[i - 1];
                const curr = this.anchorPoints[i];

                if (prev.controlOut && curr.controlIn) {
                    // Cubic bezier curve if both control points exist
                    pathData += ` C ${prev.controlOut.x},${prev.controlOut.y} ${curr.controlIn.x},${curr.controlIn.y} ${curr.x},${curr.y}`;
                } else if (prev.controlOut) {
                    // Quadratic curve if only outgoing control point exists
                    pathData += ` Q ${prev.controlOut.x},${prev.controlOut.y} ${curr.x},${curr.y}`;
                } else {
                    // Simple straight line
                    pathData += ` L ${curr.x},${curr.y}`;
                }
            }

            // Close the path if requested
            if (closed) {
                if (this.anchorPoints.length > 2) {
                    const first = this.anchorPoints[0];
                    const last = this.anchorPoints[this.anchorPoints.length - 1];

                    if (last.controlOut && first.controlIn) {
                        // Close with a curve
                        pathData += ` C ${last.controlOut.x},${last.controlOut.y} ${first.controlIn.x},${first.controlIn.y} ${first.x},${first.y}`;
                    } else {
                        // Close with a straight line
                        pathData += ` Z`;
                    }
                } else {
                    pathData += ` Z`;
                }
            }

            // Create a path object for the final result
            const finalPath = new Path(pathData, {
                fill: closed ? 'rgba(0,0,0,0.1)' : 'transparent',
                stroke: '#000000',
                strokeWidth: 2,
                selectable: true,
                evented: true
            });

            // Add to canvas
            this.canvas.add(finalPath);

            // Select it
            this.canvas.setActiveObject(finalPath);

            // Clean up all visual elements
            this.clearAllVisualElements();

            // Force render
            this.canvas.requestRenderAll();

            console.log('Created final path:', pathData);
        } catch (error) {
            console.error('Error creating final path:', error);
        }
    }

    private addAnchorPointVisual(point: AnchorPoint) {
        // Create a visual indicator for the anchor point
        const visual = new Circle({
            left: point.x - 4,
            top: point.y - 4,
            radius: 4,
            fill: '#1E90FF',
            stroke: '#000000',
            strokeWidth: 1,
            selectable: false,
            hoverCursor: 'pointer'
        });

        // Add to canvas and store reference
        this.canvas.add(visual);
        point.visual = visual;
    }

    private clearAnchorPointVisuals() {
        // Remove all visual anchor points from canvas
        this.anchorPoints.forEach(point => {
            if (point.visual) {
                this.canvas.remove(point.visual);
                point.visual = undefined;
            }
        });
    }

    private updateAnchorPointVisual(point: AnchorPoint) {
        if (point.visual) {
            point.visual.set({
                left: point.x - 4,
                top: point.y - 4
            });
        }
    }

    private addAnchorPointToSegment(segmentIndex: number, x: number, y: number) {
        if (segmentIndex < 0 || segmentIndex >= this.anchorPoints.length - 1) return;

        // Check if there's already a control point nearby
        const existingControlPoint = this.findNearestControlPoint(x, y, 15); // 15px tolerance

        if (existingControlPoint) {
            // Select the existing control point instead of creating a new one
            this.canvas.setActiveObject(existingControlPoint.visual);
            return;
        }

        // Get the points that define the segment
        const prevPoint = this.anchorPoints[segmentIndex];
        // const nextPoint = this.anchorPoints[segmentIndex + 1];

        // Remove the existing line
        if (prevPoint.lineToNext) {
            this.canvas.remove(prevPoint.lineToNext);
            prevPoint.lineToNext = undefined;
        }

        // Create the control point visual at the clicked position
        const controlVisual = new Circle({
            left: x,
            top: y,
            radius: 5,
            fill: '#FF8800',  // Different color to distinguish from anchor points
            stroke: '#000000',
            strokeWidth: 1,
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: false,
            hasBorders: false,
            hoverCursor: 'move',
            name: 'controlPoint'
        });

        this.canvas.add(controlVisual);

        // Store the control point in our array
        this.controlPoints.push({
            visual: controlVisual,
            segmentIndex: segmentIndex
        });

        // Make this the active object so it's immediately selected
        this.canvas.setActiveObject(controlVisual);

        // Initial calculation of control points
        this.updateCurveFromControlPoint(segmentIndex, x, y);

        // Add event listeners for dragging
        controlVisual.on('moving', () => {
            // Get the center position
            const controlX = controlVisual.left!;
            const controlY = controlVisual.top!;
            this.updateCurveFromControlPoint(segmentIndex, controlX, controlY);
        });

        // Ensure this control point stays on top
        this.canvas.bringObjectToFront(controlVisual);

        // Update canvas
        this.canvas.requestRenderAll();
    }

    // Find the nearest control point to a given position
    private findNearestControlPoint(x: number, y: number, tolerance = 10) {
        let closestPoint = null;
        let minDistance = tolerance;

        for (const controlPoint of this.controlPoints) {
            const distance = Math.sqrt(
                Math.pow((controlPoint.visual.left! - x), 2) +
                Math.pow((controlPoint.visual.top! - y), 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = controlPoint;
            }
        }

        return closestPoint;
    }

    // New method to update curve based on control point position
    private updateCurveFromControlPoint(segmentIndex: number, controlX: number, controlY: number) {
        if (segmentIndex < 0 || segmentIndex >= this.anchorPoints.length - 1) return;

        const prevPoint = this.anchorPoints[segmentIndex];
        const nextPoint = this.anchorPoints[segmentIndex + 1];

        // Calculate the length and direction of the original segment
        const segmentLength = Math.sqrt(
            Math.pow(nextPoint.x - prevPoint.x, 2) +
            Math.pow(nextPoint.y - prevPoint.y, 2)
        );

        const origDirection = {
            x: (nextPoint.x - prevPoint.x) / segmentLength,
            y: (nextPoint.y - prevPoint.y) / segmentLength
        };

        // Project the control point onto the line
        const t = this.projectPointOnLine(controlX, controlY, prevPoint.x, prevPoint.y, nextPoint.x, nextPoint.y);

        // Calculate perpendicular vector
        const projectedX = prevPoint.x + t * (nextPoint.x - prevPoint.x);
        const projectedY = prevPoint.y + t * (nextPoint.y - prevPoint.y);

        const perpVector = {
            x: controlX - projectedX,
            y: controlY - projectedY
        };

        // Calculate control points based on the dragged position
        prevPoint.controlOut = {
            x: prevPoint.x + origDirection.x * segmentLength * 0.33 + perpVector.x * t,
            y: prevPoint.y + origDirection.y * segmentLength * 0.33 + perpVector.y * t
        };

        nextPoint.controlIn = {
            x: nextPoint.x - origDirection.x * segmentLength * 0.33 + perpVector.x * (1 - t),
            y: nextPoint.y - origDirection.y * segmentLength * 0.33 + perpVector.y * (1 - t)
        };

        // Remove and recreate the curve
        if (prevPoint.lineToNext) {
            this.canvas.remove(prevPoint.lineToNext);
            prevPoint.lineToNext = undefined;
        }

        // Create the curved line directly from prevPoint to nextPoint
        this.createLineBetweenPoints(prevPoint, nextPoint);

        // Force render
        this.canvas.requestRenderAll();
    }

    // Helper method to project a point onto a line
    private projectPointOnLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lineLengthSq = dx * dx + dy * dy;

        // If the line is a point, return 0
        if (lineLengthSq === 0) return 0;

        // Calculate the projection parameter t (0-1 means on the segment)
        const t = ((px - x1) * dx + (py - y1) * dy) / lineLengthSq;

        // Constrain t to be between 0 and 1 (on the segment)
        return Math.max(0, Math.min(1, t));
    }

    private removeAnchorPoint(index: number) {
        if (index < 0 || index >= this.anchorPoints.length) return;

        const point = this.anchorPoints[index];

        // Remove visual marker
        if (point.visual) {
            this.canvas.remove(point.visual);
        }

        // Remove line to next point
        if (point.lineToNext) {
            this.canvas.remove(point.lineToNext);
        }

        // If we're removing a middle point, connect the points on either side
        if (index > 0 && index < this.anchorPoints.length - 1) {
            const prevPoint = this.anchorPoints[index - 1];
            const nextPoint = this.anchorPoints[index + 1];

            // Create new line
            this.createLineBetweenPoints(prevPoint, nextPoint);
        }

        // Remove the point from our array
        this.anchorPoints.splice(index, 1);

        // If we don't have enough points for a path, clean up
        if (this.anchorPoints.length < 2) {
            this.clearAllVisualElements();
        }

        // Update canvas
        this.canvas.requestRenderAll();
    }

    private findAnchorPointAt(x: number, y: number, tolerance = 10): number {
        for (let i = 0; i < this.anchorPoints.length; i++) {
            const point = this.anchorPoints[i];
            const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
            if (distance <= tolerance) {
                return i;
            }
        }
        return -1;
    }

    private findSegmentAt(x: number, y: number, tolerance = 5): number {
        for (let i = 0; i < this.anchorPoints.length - 1; i++) {
            const p1 = this.anchorPoints[i];
            const p2 = this.anchorPoints[i + 1];

            // Simple distance check for straight segments
            const distance = this.distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            if (distance <= tolerance) {
                return i;
            }
        }
        return -1;
    }

    private distanceToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    private toggleEditMode() {
        this.editMode = !this.editMode;
        if (this.editMode) {
            this.canvas.defaultCursor = 'pointer';
            // Enable selection in edit mode to allow dragging control points
            this.canvas.selection = true;

            // Hide preview line in edit mode
            if (this.previewLine) {
                this.previewLine.set({ visible: false });
            }
        } else {
            this.canvas.defaultCursor = 'crosshair';
            // Disable selection in drawing mode
            this.canvas.selection = false;

            // Update preview line
            this.updatePreviewLine();
        }

        this.canvas.requestRenderAll();
    }
} 