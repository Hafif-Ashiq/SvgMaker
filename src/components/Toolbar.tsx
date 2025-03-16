import { useCanvasContext } from '@/lib/canvas-context'
import React, { useState, useEffect } from 'react'
import ToolSection from './toolbar/ToolSection'
import { VectorPenTool } from '@/lib/vector-pen-tool'
import LayersSection from './toolbar/LayersSection'
import PropertiesSection from './properties/PropertiesSection'

interface Shape {
    shape: string;
    icon: string;
    description: string;
    onClick: () => void;
    isActive?: boolean;
}

const Toolbar: React.FC = () => {
    const { canvas, addShape, deleteSelected, exportAsSvg, addPenTool } = useCanvasContext()
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [penToolInstance, setPenToolInstance] = useState<VectorPenTool | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (penToolInstance) {
                penToolInstance.deactivate();
            }
        };
    }, [penToolInstance]);

    // Early return after all hooks have been called
    if (canvas == null) return null;

    // Handler for pen tool activation
    const handlePenToolClick = () => {
        if (activeTool === 'pen') {
            // Deactivate if already active
            if (penToolInstance) {
                penToolInstance.deactivate();
                setPenToolInstance(null);
                setActiveTool(null);
            }
        } else {
            // Activate pen tool
            const instance = addPenTool();
            if (instance) {
                setPenToolInstance(instance);
                setActiveTool('pen');
            }
        }
    };

    const shapes: Shape[] = [
        {
            shape: "Rectangle",
            icon: "/assets/toolbar-shapes/square.svg",
            description: "Add a rectangle of 200x200 in the center",
            onClick: () => {
                // Clear active tool if any
                if (penToolInstance) {
                    penToolInstance.deactivate();
                    setPenToolInstance(null);
                    setActiveTool(null);
                }
                addShape("rectangle", {
                    left: canvas.width / 2 - 100,
                    top: canvas.height / 2 - 100
                })
            }
        },
        {
            shape: "Circle",
            icon: "/assets/toolbar-shapes/circle.svg",
            description: "Add a circle of diameter 200 in the center",
            onClick: () => {
                // Clear active tool if any
                if (penToolInstance) {
                    penToolInstance.deactivate();
                    setPenToolInstance(null);
                    setActiveTool(null);
                }
                addShape("circle", {
                    left: canvas.width / 2 - 100,
                    top: canvas.height / 2 - 100
                })
            }
        },
        {
            shape: "Pen Tool",
            icon: "/assets/toolbar-shapes/pencil.svg",
            description: "Create vector paths with anchor points and Bézier curves",
            onClick: handlePenToolClick,
            isActive: activeTool === 'pen'
        },
    ]

    return (
        <aside className='w-[300px] h-[95vh] absolute left-[20px] top-[20px] bg-white shadow-[0_0_8px_0_rgba(0,0,0,0.2)] rounded-xl p-4 flex flex-col justify-between'>
            <div className='flex flex-col gap-[20px]'>
                <ToolSection label={"Shapes"} selectionArray={shapes} activeToolId={activeTool} />
                <LayersSection />
            </div>
            <div className='flex justify-center items-center gap-3'>
                <button
                    onClick={deleteSelected}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-red-600 hover:bg-red-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                    Delete
                </button>
                <button
                    onClick={exportAsSvg}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-blue-600 hover:bg-blue-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export
                </button>
            </div>
        </aside>
    )
}

export default Toolbar