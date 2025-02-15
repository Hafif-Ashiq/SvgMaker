import { useCanvasContext } from '@/lib/canvas-context'
import React from 'react'
import ToolSection from './toolbar/ToolSection'

const Toolbar = () => {
    const { canvas, addShape, deleteSelected, exportAsSvg } = useCanvasContext()

    const shapes = [
        {
            shape: "Rectangle",
            icon: "/assets/toolbar-shapes/square.svg",
            description: "Add a rectangle of 200x200 in the center",
            onClick: () => addShape("rectangle", {
                left: canvas.width / 2 - 100,
                top: canvas.height / 2 - 100
            })
        },
        {
            shape: "Circle",
            icon: "/assets/toolbar-shapes/circle.svg",
            description: "Add a circle of diameter 200 in the center",
            onClick: () => addShape("circle", {
                left: canvas.width / 2 - 100,
                top: canvas.height / 2 - 100
            })
        },

    ]

    return (
        <aside className='w-[300px] h-[95vh] absolute left-[20px] top-[20px] bg-white shadow-[0_0_8px_0_rgba(0,0,0,0.2)] rounded-xl p-4 flex flex-col justify-between'>
            <ToolSection label={"Shapes"} selectionArray={shapes} />
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