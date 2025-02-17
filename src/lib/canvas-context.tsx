'use client';

import { Canvas, Circle, Rect } from 'fabric';
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

    const updateActiveObject = () => {
        setActiveObject(canvas?.getActiveObject());
    };

    const objectSelected = (o: any) => { // You can replace 'any' with a more specific type if known
        const activeObj = o.target;
        if (activeObj.get('type') === 'group') {
            activeObj.set({
                'borderColor': '#ff00ff',
                'cornerColor': '#000000'
            });
        }
    };

    useEffect(() => {
        if (!canvas) return;
        canvas.selection;
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

        const defaultOptions = {
            left: 100,
            top: 100,
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2
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

    // Delete selected object
    const deleteSelected = useCallback(() => {
        if (!canvas || !activeObject) return;
        canvas.remove(activeObject);
        setActiveObject(null);
        canvas.renderAll();
    }, [canvas, activeObject]);

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
                exportAsSvg
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