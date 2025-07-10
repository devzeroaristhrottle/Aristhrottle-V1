import React from 'react'

function Section2() {
    return (
            <div id="section-2">
                <div className='flex flex-row justify-between pb-16 md:pb-24 pt-10 md:pt-16'>
                    <div className='w-3/4'>
                        <div className='text-[#29E0CA] text-4xl md:text-5xl font-bold mb-4'>Aristhrottle is our only hope</div>
                        <div className='text-2xl md:text-3xl'>Aristhrottle is a new content experience platform with anonymous voting on content and incentives for every vote cast and received.</div>
                    </div>
                    <div className='w-1/4 h-full flex items-center'>
                        <img alt="Aristhrottle LOGO" src="/docs/logo.png" className='h-full w-full object-contain'/>
                    </div>
                </div>

                <div className='pb-16 md:pb-24'>
                    <div className='text-2xl md:text-3xl mb-4'>AI (Aris Intelligence) is used to generate image content with a title and tags.</div>
                    <div><img src="docs/demo1.png" alt='Demo'/></div>
                </div>

                <div className='pb-16 md:pb-24'>
                    <div className='text-2xl md:text-3xl mb-4'>Limited number of votes, uploads and creations every 24 hours</div>
                    <div><img src="docs/demo2.png" alt=""/></div>
                </div>

                <div className='pb-16 md:pb-24'>
                    <div className='text-[#29E0CA] text-2xl md:text-3xl font-semibold'>The PLAN (People&apos;s Language and Art Network) is to create value from the 
                    Content, Consensus and Community built using Attention Reward Token ($ART)</div>
                </div>
            </div>
        )
}

export default Section2