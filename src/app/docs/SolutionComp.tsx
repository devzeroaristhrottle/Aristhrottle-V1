import React from 'react'
import { RiShareForwardBoxLine, RiTrophyLine  } from "react-icons/ri";

export default function SolutionComp() {
	return (
		<div className="">
			<div id="section-1"></div>
			<div id="section-2">
				<div className='flex flex-row justify-between pb-32 pt-16'>
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
			<div id="section-3">
				<div id="phase-1">
					<div className='text-[#29E0CA] text-[50px]'>Phase 1 : Incentivized BETA Testnet</div>
					<div className='text-[40px]'>Testing of core features and user feedback collection for further iteration. The rewards in this phase are early $ART Points - $eART and they are distributed using the following means :</div>
					<div>
						<div className='flex gap-2 items-center'>
							<img src='/assets/vote/icon2.png' className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Vote cast - </div>
							<div className='text-[#29E0CA] text-[40px]'>0.1 $eART</div>
						</div>
						<div className='flex gap-2 items-center'>
							<img src="/assets/vote/icon1.png" className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Vote received - </div>
							<div className='text-[#29E0CA] text-[40px]'>1 $eART</div>
						</div>
						<div className='flex gap-2 items-center'>
							<RiShareForwardBoxLine className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Referral shared - </div>
							<div className='text-[#29E0CA] text-[40px]'>5 $eART</div>
						</div>
						<div className='flex gap-2 items-center'>
							<RiTrophyLine className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Milestones for </div>
							<div className='text-[#29E0CA] text-[40px]'> extra rewards</div>
						</div>
					</div>
				</div>
				<div id="phase-2"></div>
				<div id="phase-3"></div>
			</div>
		</div>
	)
}
