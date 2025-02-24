import Image from 'next/image';
import React from 'react';

interface Shape {
    shape: string;
    icon: string;
    onClick: () => void;
}

interface ToolSectionProps {
    label: string;
    selectionArray: Shape[];
}

const ToolSection: React.FC<ToolSectionProps> = ({ label, selectionArray }) => {
    return (
        <div className='flex flex-col gap-[20px]'>
            <span className='font-bold text-left text-[18px]'>
                {label}
            </span>
            <div className='flex flex-wrap gap-[10px]'>
                {
                    selectionArray.map(shape => (
                        <button onClick={shape.onClick} key={shape.shape} className='flex flex-col justify-center items-center'>
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