import React, { useEffect, useState } from 'react';
import { Object as FabricObject } from 'fabric';
import { useCanvasContext } from '@/lib/canvas-context';

interface LayerWithName extends FabricObject {
    customName?: string;
}

const LayersSection = () => {
    const { canvas } = useCanvasContext();
    const [layers, setLayers] = useState<LayerWithName[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (!canvas) return;

        // Initial load of objects
        setLayers(canvas.getObjects());

        // Update layers when objects are added or removed
        const updateLayers = () => {
            // Check if the pen tool is active before updating layers
            // This prevents layer updates during active drawing operations
            const activeObjects = canvas.getActiveObjects();
            const isPenToolActive = activeObjects.some(obj =>
                obj.type === 'path'
            );

            if (isPenToolActive) {
                return; // Skip updating layers while pen tool is actively drawing
            }
            setLayers(canvas.getObjects());
        };

        canvas.on('object:added', updateLayers);
        canvas.on('object:removed', updateLayers);

        return () => {
            canvas.off('object:added', updateLayers);
            canvas.off('object:removed', updateLayers);
        };
    }, [canvas]);

    const handleRename = (index: number) => {
        setEditingId(index);
        setEditingName(layers[index].customName || `${layers[index].type || 'Shape'} ${index + 1}`);
    };

    const handleSaveRename = (index: number) => {
        if (editingName.trim()) {
            const updatedLayers = [...layers];
            updatedLayers[index].customName = editingName.trim();
            setLayers(updatedLayers);
        }
        setEditingId(null);
    };

    const handleKeyPress = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            handleSaveRename(index);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    return (
        <div className="p-2">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Layers</h3>
                <span className="text-sm text-gray-500">{layers.length} items</span>
            </div>
            <div className="space-y-1">
                {layers.map((layer, index) => (
                    <div
                        key={index}
                        className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer group"
                        onClick={() => {
                            if (canvas && editingId !== index) {
                                canvas.setActiveObject(layer);
                                canvas.requestRenderAll();
                            }
                        }}
                    >
                        <div className="flex-1">
                            {editingId === index ? (
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => handleSaveRename(index)}
                                    onKeyDown={(e) => handleKeyPress(e, index)}
                                    className="w-full px-1 py-0.5 text-sm border rounded"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className="text-sm"
                                    onDoubleClick={() => handleRename(index)}
                                >
                                    {layer.customName || `${layer.type || 'Shape'} ${index + 1}`}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                className="text-gray-500 hover:text-blue-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRename(index);
                                }}
                                title="Rename"
                            >
                                ✏️
                            </button>
                            <button
                                className="text-gray-500 hover:text-gray-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canvas) {
                                        layer.visible = !layer.visible;
                                        canvas.requestRenderAll();
                                    }
                                }}
                                title="Toggle visibility"
                            >
                                {layer.visible ? '👁️' : '👁️‍🗨️'}
                            </button>
                            <button
                                className="text-gray-500 hover:text-red-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (canvas) {
                                        canvas.remove(layer);
                                    }
                                }}
                                title="Delete"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LayersSection;