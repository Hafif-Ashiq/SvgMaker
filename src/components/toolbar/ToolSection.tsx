import Image from 'next/image';
import React from 'react';

interface Shape {
    shape: string;
    icon: string;
    onClick: () => void;
    isActive?: boolean;
}

interface ToolSectionProps {
    label: string;
    selectionArray: Shape[];
    activeToolId?: string | null;
}

const ToolSection: React.FC<ToolSectionProps> = ({ label, selectionArray, activeToolId }) => {
    return (
        <div className='flex flex-col gap-[20px]' key={activeToolId}>
            <span className='font-bold text-left text-[18px]'>
                {label}
            </span>
            <div className='flex flex-wrap gap-[10px]'>
                {
                    selectionArray.map(shape => (
                        <button
                            onClick={shape.onClick}
                            key={shape.shape}
                            className={`flex-1 flex flex-col justify-center items-center p-2 rounded-md ${shape.isActive ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}`}
                        >
                            <Image src={shape.icon} width={40} height={40} alt="" />
                            <span>{shape.shape}</span>
                        </button>
                    ))
                }
            </div>
        </div>
    );
}

export default ToolSection;