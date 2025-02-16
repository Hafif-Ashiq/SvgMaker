'use client';

import { Canvas, Circle, Rect } from 'fabric';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CanvasContext = createContext(undefined);

export function CanvasProvider({ children }) {
    // Core canvas state
    const [canvas, setCanvas] = useState(null);
    const [activeObject, setActiveObject] = useState(null);
    const [zoom, setZoom] = useState(1);

    const updateActiveObject = () => {
        setActiveObject(canvas.getActiveObject())
    }

    useEffect(() => {
        if (!canvas) return

        canvas.on("selection:created", updateActiveObject);
        canvas.on("selection:updated", updateActiveObject);
        canvas.on("selection:cleared", updateActiveObject);

        return () => {
            canvas.off("selection:created", updateActiveObject);
            canvas.off("selection:updated", updateActiveObject);
            canvas.off("selection:cleared", updateActiveObject);
            canvas.dispose();
        };
    }, [canvas])

    // Basic shape creation
    const addShape = useCallback((type, options = {}) => {

        if (!canvas) return;

        console.log(canvas)

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
                // canvas.isDrawingMode = true;
                // canvas.freeDrawingBrush = new Circle({
                //     width: 10,
                //     height: 10,
                //     fill: 'transparent',
                //     stroke: '#000000',
                //     strokeWidth: 2,
                //     originX: 'center',
                //     originY: 'center'
                // });
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
        const handleKeyDown = (event) => {
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

        const copy = await activeObject.clone()
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