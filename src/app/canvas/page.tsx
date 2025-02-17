"use client"
import { Canvas } from 'fabric'
import React, { useEffect, useRef } from 'react'
import { useCanvasContext, CanvasProvider } from '@/lib/canvas-context'
import Toolbar from '@/components/Toolbar'

const CanvasPage = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const { setCanvas, zoom } = useCanvasContext()

    useEffect(() => {
        if (canvasRef.current) {
            const fabricCanvas = new Canvas(canvasRef.current, {
                width: window.innerWidth,
                height: window.innerHeight,
                // selectionColor: "#000000",
                selectionBorderColor: "#00ff00",
                selectionColor: "#00ff0010"
                // backgroundColor: '#ffffff'
            })

            setCanvas(fabricCanvas)
            fabricCanvas.renderAll()

            // Cleanup on unmount
            return () => {
                fabricCanvas.dispose()
            }
        }
    }, [setCanvas])

    return (
        <div className='w-screen h-screen bg-grid-background bg-repeat bg-[length:18]'>
            <div style={{ transform: `scale(${zoom})` }}>
                <canvas id='canvas' ref={canvasRef} />
                <Toolbar />
            </div>
        </div>
    )
}

const Page = () => {
    return (
        <CanvasProvider>
            <CanvasPage />
        </CanvasProvider>
    )
}

export default Page