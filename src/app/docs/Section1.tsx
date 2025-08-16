import { IoCloudUploadOutline } from 'react-icons/io5';
import { BsCash } from "react-icons/bs";
import { BsSnow } from "react-icons/bs";
import { HiSparkles } from "react-icons/hi2";


function Section1() {
  return (
    <div id="section-1" className='w-full'>
				<div className='text-[#29E0CA] text-4xl md:text-5xl font-bold mb-4'>How to stop the bleeding?</div>
				<div className='w-full flex flex-col justify-center items-center pt-10 md:pt-14'>
					<div className="flex items-center justify-evenly w-64">
						<IoCloudUploadOutline className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsCash className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB] mr-6 md:mr-8'/>
					</div>
					<div className='text-2xl md:text-3xl font-semibold mt-4'>
						Fair payout - for all users
					</div>
				</div>
				<div className='w-full flex flex-col justify-center items-center pt-10 md:pt-14'>
					<div className="flex items-center justify-evenly w-64">
						<img src='/assets/vote/icon2.png' className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsCash className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB] mr-6 md:mr-8'/>
					</div>
					<div className='text-2xl md:text-3xl font-semibold mt-4'>
						Attention incentives - for interaction
					</div>
				</div>
				<div className='w-full flex flex-col justify-center items-center pt-10 md:pt-14'>
					<div className="flex items-center justify-evenly w-64">
						<HiSparkles className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsCash className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB] mr-6 md:mr-8'/>
					</div>
					<div className='text-2xl md:text-3xl font-semibold mt-4'>
						Generative AI - for content creation
					</div>
				</div>
				<div className='w-full flex flex-col justify-center items-center pt-10 md:pt-14'>
					<div className="flex items-center justify-evenly w-64">
						<IoCloudUploadOutline className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB]'/>
						<div className="flex-1 h-0.5 bg-[#1783FB] mx-4"></div>
						<BsSnow className='h-[48px] w-[48px] md:h-[60px] md:w-[60px] p-2 rounded-full border border-[#1783FB] mr-6 md:mr-8'/>
					</div>
					<div className='text-2xl md:text-3xl font-semibold mt-4'>
						Anonymous voting - to avoid manipulation
					</div>
				</div>
			</div>
  )
}

export default Section1