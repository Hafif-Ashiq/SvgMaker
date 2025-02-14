import React from 'react'

const ToolSection = ({ label, selectionArray }) => {
    return (
        <div className='flex flex-col gap-[20px]'>
            <span className='font-bold text-left text-[18px]'>
                {label}
            </span>
            <div className='flex flex-wrap gap-[10px]'>
                {
                    selectionArray.map(shape => (
                        <button onClick={shape.onClick} key={shape.shape} className='flex flex-col justify-center items-center'>
                            <img src={shape.icon} className='w-[40px] h-[40px] ' alt="" />
                            <span>{shape.shape}</span>
                        </button>
                    ))
                }
            </div>
        </div>
    )
}

export default ToolSection