import React from 'react'

function Section2() {
    return (
        <div id="section-2" className="space-y-8 md:space-y-16">
            <div className='flex flex-col md:flex-row justify-between gap-6 md:gap-8 pt-4 md:pt-8'>
                <div className='w-full md:w-3/4'>
                    <div className='text-[#29E0CA] text-2xl md:text-5xl font-bold mb-2 md:mb-4'>Aristhrottle is our only hope</div>
                    <div className='text-lg md:text-3xl'>Aristhrottle is a new content experience platform with anonymous voting on content and incentives for every vote cast and received.</div>
                </div>
                <div className='w-full md:w-1/4 h-32 md:h-full flex items-center justify-center md:justify-end'>
                    <img alt="Aristhrottle LOGO" src="/docs/logo.png" className='h-full w-auto object-contain'/>
                </div>
            </div>

            <div>
                <div className='text-lg md:text-3xl mb-2 md:mb-4'>AI (Aris Intelligence) is used to generate image content with a title and tags.</div>
                <div className='overflow-hidden rounded-lg'>
                    <img src="docs/demo1.png" alt='Demo' className='w-full'/>
                </div>
            </div>

            <div>
                <div className='text-lg md:text-3xl mb-2 md:mb-4'>Limited number of votes, uploads and creations every 24 hours</div>
                <div className='overflow-hidden rounded-lg'>
                    <img src="docs/demo2.png" alt="Daily limits" className='w-full'/>
                </div>
            </div>

            <div>
                <div className='text-[#29E0CA] text-lg md:text-3xl font-semibold leading-snug'>
                    The PLAN (People&apos;s Language and Art Network) is to create value from the 
                    Content, Consensus and Community built using Attention Reward Token ($ART)
                </div>
            </div>
        </div>
    )
}

export default Section2