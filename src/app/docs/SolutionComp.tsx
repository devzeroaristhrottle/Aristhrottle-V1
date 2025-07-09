import React from 'react'

export default function SolutionComp() {
	return (
		<div className="">
			<div id="section-1"></div>
			<div id="section-2">
				<div className='flex flex-row justify-between pb-32'>
					<div className='w-3/4'>
						<div className='text-[#29E0CA] text-[50px]'>Aristhrottle is our only hope</div>
						<div className='text-[40px]'>Aristhrottle is a new content experience platform with anonymous voting on content and incentives for every vote cast and received.</div>
					</div>
					<div className='w-1/4 h-full'>
						<img alt="Aristhrottle LOGO" src="/docs/logo.png" className='h-full w-full'/>
					</div>
				</div>

				<div className='pb-32'>
					<div className='text-[40px]'>AI (Aris Intelligence) is used to generate image content with a title and tags.</div>
					<div><img src="docs/demo1.png" alt='Demo'/></div>
				</div>

				<div className='pb-32'>
					<div className='text-[40px]'>Limited number of votes, uploads and creations every 24 hours</div>
					<div><img src="docs/demo2.png" alt=""/></div>
				</div>

				<div className='pb-32'>
					<div className='text-[#29E0CA] text-[40px]'>The PLAN (People&apos;s Language and Art Network) is to create value from the 
					Content, Consensus and Community built using Attention Reward Token ($ART)</div>
				</div>
			</div>
			<div id="section-3"></div>
		</div>
	)
}
