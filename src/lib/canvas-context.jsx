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

    // Basic shape creation
    const addShape = useCallback((type, options = {}) => {

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
                deleteSelected
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