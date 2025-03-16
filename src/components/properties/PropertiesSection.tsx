import React, { useEffect, useState } from 'react';
import { Object as FabricObject } from 'fabric';
import { useCanvasContext } from '@/lib/canvas-context';

interface ObjectProperties {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    visible: boolean;
}

const PropertiesSection = () => {
    const { canvas } = useCanvasContext();
    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const [properties, setProperties] = useState<ObjectProperties>({
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 1,
        opacity: 1,
        visible: true,
    });

    useEffect(() => {
        if (!canvas) return;

        const updateSelection = () => {
            const activeObject = canvas.getActiveObject();
            setSelectedObject(activeObject || null);

            if (activeObject) {
                setProperties({
                    fill: activeObject.fill?.toString() || '#000000',
                    stroke: activeObject.stroke?.toString() || '#000000',
                    strokeWidth: activeObject.strokeWidth || 1,
                    opacity: activeObject.opacity || 1,
                    visible: activeObject.visible || true,
                });
            }
        };

        canvas.on('selection:created', updateSelection);
        canvas.on('selection:updated', updateSelection);
        canvas.on('selection:cleared', () => setSelectedObject(null));

        return () => {
            canvas.off('selection:created', updateSelection);
            canvas.off('selection:updated', updateSelection);
            canvas.off('selection:cleared', () => setSelectedObject(null));
        };
    }, [canvas]);

    const updateProperty = (property: keyof ObjectProperties, value: string | number | boolean) => {
        if (!selectedObject || !canvas) return;

        // Update the object
        selectedObject.set(property, value);

        // Update local state
        setProperties(prev => ({
            ...prev,
            [property]: value
        }));

        canvas.requestRenderAll();
    };

    if (!selectedObject) {
        return (
            <div className="bg-white shadow-[0_0_8px_0_rgba(0,0,0,0.2)] rounded-xl w-[300px] h-[95vh] absolute right-[20px] top-[20px] flex justify-center items-center p-4 text-center text-gray-500">
                Select an object to edit its properties
            </div>
        );
    }

    return (
        <div className="bg-white shadow-[0_0_8px_0_rgba(0,0,0,0.2)] rounded-xl w-[300px] h-[95vh] absolute right-[20px] top-[20px] p-4 space-y-4">
            <h3 className="font-medium">Properties</h3>

            {/* Fill Color */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Fill Color
                </label>
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={properties.fill}
                        onChange={(e) => updateProperty('fill', e.target.value)}
                        className="h-8 w-8 rounded cursor-pointer"
                    />
                    <input
                        type="text"
                        value={properties.fill}
                        onChange={(e) => updateProperty('fill', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                </div>
            </div>

            {/* Stroke Color */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Stroke Color
                </label>
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={properties.stroke}
                        onChange={(e) => updateProperty('stroke', e.target.value)}
                        className="h-8 w-8 rounded cursor-pointer"
                    />
                    <input
                        type="text"
                        value={properties.stroke}
                        onChange={(e) => updateProperty('stroke', e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                </div>
            </div>

            {/* Stroke Width */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Stroke Width
                </label>
                <div className="flex gap-2 items-center">
                    <input
                        type="range"
                        min="0"
                        max="20"
                        value={properties.strokeWidth}
                        onChange={(e) => updateProperty('strokeWidth', Number(e.target.value))}
                        className="flex-1"
                    />
                    <input
                        type="number"
                        value={properties.strokeWidth}
                        onChange={(e) => updateProperty('strokeWidth', Number(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border rounded"
                        min="0"
                        max="20"
                    />
                </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Opacity
                </label>
                <div className="flex gap-2 items-center">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={properties.opacity}
                        onChange={(e) => updateProperty('opacity', Number(e.target.value))}
                        className="flex-1"
                    />
                    <input
                        type="number"
                        value={properties.opacity}
                        onChange={(e) => updateProperty('opacity', Number(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border rounded"
                        min="0"
                        max="1"
                        step="0.1"
                    />
                </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                    Visible
                </label>
                <input
                    type="checkbox"
                    checked={properties.visible}
                    onChange={(e) => updateProperty('visible', e.target.checked)}
                    className="rounded"
                />
            </div>

            {/* Additional Properties based on object type */}
            {selectedObject.type === 'path' && (
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Path Properties</h4>
                    {/* Add path-specific properties here */}
                </div>
            )}
        </div>
    );
};

export default PropertiesSection;