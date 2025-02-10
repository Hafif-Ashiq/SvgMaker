import { useCanvasContext } from '@/lib/canvas-context'
import React from 'react'

const Toolbar = () => {
    const { addShape } = useCanvasContext()
    return (
        <aside className='w-[200px] h-screen absolute left-0 top-0 bg-white'>
            <button onClick={() => addShape("rectangle", {
                left: 700,
                top: 200,
                fill: "transparent"
            })}>
                Add Rectangle
            </button>
        </aside>
    )
}

export default Toolbar