'use client';

import { Canvas, Circle, FabricObject, Rect, TPointerEvent, TPointerEventInfo, Line, Polyline, Path, util } from 'fabric';
// import { Line } from 'fabric/fabric-impl';
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface CanvasContextType {
    canvas: Canvas | null;
    setCanvas: (canvas: Canvas | null) => void;
    activeObject: any; // You can replace 'any' with a more specific type if known
    setActiveObject: (object: any) => void; // You can replace 'any' with a more specific type if known
    zoom: number;
    setZoom: (zoom: number) => void;
    addShape: (type: string, options?: any) => void; // You can replace 'any' with a more specific type if known
    deleteSelected: () => void;
    exportAsSvg: () => Promise<void>;
    addDrawingTool: (tool: string) => void
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

interface CanvasProviderProps {
    children: ReactNode;
}

export function CanvasProvider({ children }: CanvasProviderProps) {
    // Core canvas state
    const [canvas, setCanvas] = useState<Canvas | null>(null);
    const [activeObject, setActiveObject] = useState<any>(null); // You can replace 'any' with a more specific type if known
    const [zoom, setZoom] = useState<number>(1);

    const [clipboard, setClipboard] = useState<FabricObject | null>(null);


    const updateActiveObject = (o: any) => {
        setActiveObject(canvas?.getActiveObject());
    };

    useEffect(() => {
        if (!canvas) return;

        canvas.on("selection:created", updateActiveObject);
        canvas.on("selection:updated", updateActiveObject);
        canvas.on("selection:cleared", updateActiveObject);
        // canvas.on('object:selected', objectSelected);

        return () => {
            canvas.off("selection:created", updateActiveObject);
            canvas.off("selection:updated", updateActiveObject);
            canvas.off("selection:cleared", updateActiveObject);
            // canvas.off('object:selected', objectSelected);

            canvas.dispose();
        };
    }, [canvas]);

    // Basic shape creation
    const addShape = useCallback((type: string, options: any = {}) => { // You can replace 'any' with a more specific type if known
        if (!canvas) return;

        const defaultOptions: Partial<fabric.Object> = {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
            cornerStyle: "circle",
            transparentCorners: false,
            cornerSize: 8,
        };

        let shape;
        switch (type) {
            case 'rectangle':
                shape = new Rect({
                    ...defaultOptions,
                    width: 100,
                    height: 100,
                    ...options
                });
                break;
            case 'circle':
                shape = new Circle({
                    ...defaultOptions,
                    radius: 50,
                    ...options
                });
                break;
            default:
                return;
        }
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.renderAll();
    }, [canvas]);

    const addDrawingTool = useCallback((tool: string) => {
        if (!canvas) return
        let drawing = false;
        let currentLine: Line | null = null;

        const startDrawing = (event: TPointerEventInfo<TPointerEvent>) => {
            const pointer = canvas.getPointer(event.e);
            drawing = true;
            canvas.set({
                selectionBorderColor: "transparent",
                selectionColor: "transparent"
            })

            canvas.setCursor('url(/assets/tooolbar-shapes/pencil.svg), auto');
            currentLine = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                strokeWidth: 2,
                fill: 'transparent',
                stroke: tool === 'pen' ? '#000000' : '#FF0000',
                selectable: false,
            });
            // currentLine = new Polyline([{
            //     x: pointer.x,
            //     y: pointer.y
            // }, {
            //     x: pointer.x,
            //     y:pointer.y
            // }], {
            //     strokeWidth: 2,
            //     fill: 'transparent',
            //     stroke: tool === 'pen' ? '#000000' : '#FF0000',
            //     selectable: false,
            // });
            canvas.add(currentLine)

            // canvas.add(currentLine as fabric.Line);
        };

        const draw = (event: TPointerEventInfo<TPointerEvent>) => {
            if (!drawing || !currentLine) return;

            const pointer = canvas.getPointer(event.e);
            currentLine.set({ x2: pointer.x, y2: pointer.y });
            canvas.renderAll();
        };

        const stopDrawing = () => {
            if (currentLine) {
                currentLine.set({ selectable: true })
            }
            drawing = false;
            currentLine = null;
            canvas.set({
                selectionBorderColor: "#00ff00",
                selectionColor: "#00ff0010"
            })
            // Remove the drawing tool by cleaning up event listeners
            canvas.off('mouse:down', startDrawing);
            canvas.off('mouse:move', draw);
            canvas.off('mouse:up', stopDrawing);
        };

        canvas.on('mouse:down', startDrawing);
        canvas.on('mouse:move', draw);
        canvas.on('mouse:up', stopDrawing);

        // Cleanup event listeners on unmount
        return () => {
            canvas.off('mouse:down', startDrawing);
            canvas.off('mouse:move', draw);
            canvas.off('mouse:up', stopDrawing);
        };
    }, [canvas]);

    // Delete selected object
    const deleteSelected = useCallback(() => {
        if (!canvas) return;
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) return;

        // Deactivate the current selection
        canvas.discardActiveObject();

        // Remove the selected objects
        activeObjects.forEach(obj => canvas.remove(obj));
        setActiveObject(null);
        canvas.renderAll();
    }, [canvas]);

    // Add event listener for keydown
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Delete') {
                deleteSelected();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deleteSelected]);

    const exportAsSvg = useCallback(async () => {
        if (!canvas || !activeObject) return;

        const { width, height } = activeObject.getBoundingRect();

        const newCanvas = new Canvas(document.createElement('canvas'), {
            width: width,
            height: height
        });

        const copy = await activeObject.clone();
        copy.set({
            left: 0, // Adjust based on the viewBox
            top: 0    // Adjust based on the viewBox
        });
        newCanvas.add(copy);

        // Convert the new Fabric canvas to SVG
        let svg = newCanvas.toSVG();
        svg = svg.replace(/<desc>.*?<\/desc>/, '');
        console.log(svg); // You can handle the new SVG as needed

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "canvas-export.svg");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        newCanvas.dispose();
    }, [canvas, activeObject]);

    const copySelected = useCallback(async () => {
        if (!activeObject) return;

        const clonedObject = await activeObject.clone();
        // Store the cloned object in a way that it can be pasted later
        setClipboard(clonedObject);
    }, [activeObject]);

    const pasteCopied = useCallback(async () => {
        if (!canvas || !clipboard) return;

        const obj = await clipboard.clone();

        // Position the cloned object slightly offset from the original
        obj.set({
            left: obj.left + 10,
            top: obj.top + 10,
        });
        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();


    }, [canvas, clipboard]);

    // Add event listener for keydown to handle copy and paste
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'c' && (event.ctrlKey || event.metaKey)) {
                copySelected();
            }
            if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
                pasteCopied();
            }
            if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                copySelected().then(() => {
                    pasteCopied()
                })
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Cleanup event listener on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [copySelected, pasteCopied]);

    return (
        <CanvasContext.Provider
            value={{
                canvas,
                setCanvas,
                activeObject,
                setActiveObject,
                zoom,
                setZoom,
                addShape,
                deleteSelected,
                exportAsSvg,
                addDrawingTool
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
}

export const useCanvasContext = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error('useCanvasContext must be used within a CanvasProvider');
    }
    return context;
}; 