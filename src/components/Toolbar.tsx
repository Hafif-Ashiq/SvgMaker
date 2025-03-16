import { useCanvasContext } from '@/lib/canvas-context'
import React, { useState, useEffect } from 'react'
import ToolSection from './toolbar/ToolSection'
import { VectorPenTool } from '@/lib/vector-pen-tool'

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
            <ToolSection label={"Shapes"} selectionArray={shapes} activeToolId={activeTool} />
            <div className='flex justify-center flex-col items-center gap-3'>
                <button onClick={deleteSelected}>
                    Delete
                </button>
                <button onClick={exportAsSvg}>
                    Export
                </button>
            </div>
        </aside>
    )
}

export default Toolbar