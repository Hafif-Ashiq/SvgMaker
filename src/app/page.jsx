import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div className='w-screen h-screen flex justify-center items-center'>
      <Link href={"/canvas"} className='px-4 py-2 bg-black rounded-full text-white text-[24px]'>Go to Canvas</Link>

    </div>
  )
}

export default page