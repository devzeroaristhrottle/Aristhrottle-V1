import React from 'react'
import { RiShareForwardBoxLine, RiTrophyLine  } from "react-icons/ri";
import { HiOutlineRocketLaunch, HiSparkles } from "react-icons/hi2";
import { SlBadge } from "react-icons/sl";
import { CgDollar } from "react-icons/cg";
import { TfiTarget } from "react-icons/tfi";
import { CiStar } from "react-icons/ci";
import { IoCloudUploadOutline } from 'react-icons/io5';
import { BsCash } from "react-icons/bs";
import { BsSnow } from "react-icons/bs";


export default function SolutionComp() {
	return (
		<div className="">
			<div id="section-1" className='w-full'>
				<div className='text-[#29E0CA] text-[50px]'>How to stop the bleeding?</div>
				<div className='w-full flex flex-col justify-center items-center pt-16'>
					<div className="flex items-center justify-evenly w-64">
						<IoCloudUploadOutline className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsCash className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB] mr-8'/>
					</div>
					<div className='text-[40px]'>
						Fair payout - for all users
					</div>
				</div>
				<div className='w-full flex flex-col justify-center items-center pt-16'>
					<div className="flex items-center justify-evenly w-64">
						<img src='/assets/vote/icon2.png' className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsCash className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB] mr-8'/>
					</div>
					<div className='text-[40px]'>
						Attention incentives - for interaction
					</div>
				</div>
				<div className='w-full flex flex-col justify-center items-center pt-16'>
					<div className="flex items-center justify-evenly w-64">
						<HiSparkles className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsCash className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB] mr-8'/>
					</div>
					<div className='text-[40px]'>
						Generative AI - for content creation
					</div>
				</div>
				<div className='w-full flex flex-col justify-center items-center pt-16'>
					<div className="flex items-center justify-evenly w-64">
						<IoCloudUploadOutline className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsSnow className='h-[60px] w-[60px] p-2 rounded-full border border-[#1783FB] mr-8'/>
					</div>
					<div className='text-[40px]'>
						Anonymous voting - to avoid manipulation
					</div>
				</div>
			</div>
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
				<div id="phase-1" className='pt-16'>
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
				<div id="phase-2" className='pt-16'>
					<div className='text-[#29E0CA] text-[50px]'>Phase 2: MainNet Launch</div>
					<div>
						<div className='flex gap-2 items-center'>
							<HiOutlineRocketLaunch className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Mobile app and $ART Token launch. </div>
						</div>
						<div className='flex gap-2 items-center'>
							<SlBadge className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Extra rewards for people who have contributed in the Beta phase through Airdrops.</div>
						</div>
						<div className='flex gap-2 items-center'>
							<CgDollar className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>$eART will be converted to $ART at the value, 1 $eART = 10 $ART</div>
						</div>
						<div className='flex gap-2 items-center'>
							<TfiTarget className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>$ART will be tradable for USD, INR, BTC, ETH and other currencies in public markets</div>
						</div>
						<div className='flex gap-2 items-center'>
							<CiStar className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Mobile app will have enhanced features and enterprise partnerships</div>
						</div>
					</div>
				</div>
				<div id="phase-3" className='pt-16'>
					<div className='text-[#29E0CA] text-[50px]'>Phase 3 : Advancement in AI, App Experience & $ART Utility</div>
					<div>
						<div className='flex gap-2 items-center'>
							<HiSparkles className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Agentic AI improvement through RAG pipeline to enhance user experience</div>
						</div>
						<div className='flex gap-2 items-center'>
							<img src="/docs/video.png" className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Generation of new content through AI - Stories, videos and more</div>
						</div>
						<div className='flex gap-2 items-center'>
							<CiStar className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>$ART Utility using DeFi applications</div>
						</div>
						<div className='flex gap-2 items-center'>
							<CiStar className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Partnerships with third party developers for mini apps and games on Aristhrottle</div>
						</div>
						<div className='flex gap-2 items-center'>
							<CiStar className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Redeem your $eART today and be a part of the next revolution in digital media</div>
						</div>
						<div className='flex gap-2 items-center'>
							<CiStar className='h-10 w-10 p-2 rounded-full border border-[#1783FB] mr-8'/>
							<div className='text-[40px]'>Beta will be open for a limited time period, use your attention and get its true value</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
