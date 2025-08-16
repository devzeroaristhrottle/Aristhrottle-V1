import React, { useEffect, useRef } from 'react'

export default function ProblemComp({ onEndReached }: { onEndReached?: () => void }) {
	const endRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!onEndReached) return
		const observer = new window.IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					onEndReached()
				}
			},
			{ threshold: 1.0 }
		)
		if (endRef.current) {
			observer.observe(endRef.current)
		}
		return () => {
			if (endRef.current) observer.unobserve(endRef.current)
		}
	}, [onEndReached])

	return (
		<div className="space-y-8 md:space-y-12">
			<div className='font-medium text-2xl md:text-[50px] text-[#29E0CA] leading-tight'>
				Your attention has no value. Does it?
			</div>
            <div className='text-lg md:text-[35px] leading-snug'>
                Happiness is proportional to wealth and not the other way round. The value of Attention lies 
                in the monetary value it creates for a human. So far, attention on the internet has created 
                no real value for 99% of the humans using content sharing applications.
            </div>
            <div className='flex flex-row items-start md:items-center gap-4 md:gap-8 text-xl md:text-[40px] pt-8 md:pt-16'>
                <img src='/docs/1.png' className='w-16 md:w-auto'/>
                <div className='flex flex-col gap-1 md:gap-2 md:flex-row'>
                    <div>Average time on content apps is</div>
                    <div className='text-[#29E0CA]'>More than 2 Hours/Day</div>
                </div>
            </div>
            <div className='flex flex-row items-start md:items-center gap-4 md:gap-8 text-xl md:text-[40px]'>
                <img src='/docs/2.png' className='w-16 md:w-auto'/>
                <div className='flex flex-col gap-1 md:gap-2 md:flex-row'>
                    <div>Average Attention Span is</div>
                    <div className='text-[#29E0CA]'>Less than 10 Seconds</div>
                </div>
            </div>
            <div className='h-fit py-8 md:py-16 flex w-full items-center justify-center'>
                <img src="/docs/columns.svg" className='w-full max-w-3xl'/>
            </div>
            <div className='flex flex-row md:flex-row items-start md:items-center gap-4 md:gap-8 text-xl md:text-[40px]'>
                <img src='/docs/3.png' className='w-16 md:w-auto'/>
                <div className='flex flex-col gap-1 md:gap-2 md:flex-row'>
                    <div>Internet Ad Revenue across these is</div>
                    <div className='text-[#29E0CA]'>Nearly $225 Billion</div>
                </div>
            </div>
            <div className='flex flex-row md:flex-row items-start md:items-center gap-4 md:gap-8 text-xl md:text-[40px]'>
                <img src='/docs/4.png' className='w-16 md:w-auto'/>
                <div className='flex flex-col gap-1 md:gap-2 md:flex-row'>
                    <div>Creator Payout remains</div>
                    <div className='text-[#29E0CA]'>Only $23-30 Billion (10-13%)</div>
                </div>
            </div>
            <div className='h-fit py-8 md:py-16 flex w-full items-center justify-center'>
                <img src="/docs/pie.svg" className='w-full max-w-3xl'/>
            </div>
            <div className='text-2xl md:text-[50px] font-medium text-[#29E0CA] leading-tight'>What do other users get?</div>
            <div className='flex flex-row justify-evenly pt-4 md:pt-14'>
                <div className='flex flex-col items-center gap-2 md:gap-4'>
                    <div className='rounded-full h-12 w-12 md:h-20 md:w-20 bg-[#D9D9D9] flex justify-center items-center'>
                        <img src='/docs/v1.png' className='h-8 w-8 md:h-12 md:w-12'/>
                    </div>
                    <div className='text-base md:text-[40px]'>
                        Entertainment
                    </div>
                </div>

                <div className='flex flex-col items-center gap-2 md:gap-4'>
                    <div className='rounded-full h-12 w-12 md:h-20 md:w-20 bg-[#D9D9D9] flex justify-center items-center'>
                        <img src='/docs/f1.png' className='h-12 w-12 md:h-20 md:w-20'/>
                    </div>
                    <div className='text-base md:text-[40px]'>
                        Pleasure
                    </div>
                </div>

                <div className='flex flex-col items-center gap-2 md:gap-4'>
                    <div className='rounded-full h-12 w-12 md:h-20 md:w-20 bg-[#D9D9D9] flex justify-center items-center'>
                        <img src='/docs/k1.png' className='h-8 w-8 md:h-12 md:w-12'/>
                    </div>
                    <div className='text-base md:text-[40px]'>
                        Knowledge
                    </div>
                </div>
            </div>
			{/* End marker for intersection observer */}
			<div ref={endRef} style={{ height: 1 }} />
		</div>
	)
}
