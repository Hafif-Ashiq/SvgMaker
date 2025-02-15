'use client';

import { Circle, Rect } from 'fabric';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
// import { fabric } from 'fabric';

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


    const exportAsSvg = useCallback(() => {
        if (!canvas || !activeObject) return;
        const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no" ?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
        <svg height="64px" width="64px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 60 60" xml:space="preserve"> 
        ${activeObject.toSVG()}
        </svg>`;

        // const svg = canvas.toSVG()
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "canvas-export.svg");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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