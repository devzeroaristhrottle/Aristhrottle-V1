import Image from 'next/image'
import React from 'react'
import { FaRegBookmark } from 'react-icons/fa'
import { GrCloudUpload } from 'react-icons/gr'
import { IoPodiumOutline } from 'react-icons/io5'
import { LuTrophy } from 'react-icons/lu'

function BottomNav() {
	return (
	<div className=" bottom-0 absolute z-50 flex flex-row justify-evenly w-screen items-center">
		<div>
			<LuTrophy className="h-6 w-6" />
		</div>
		<div>
			<GrCloudUpload className="h-6 w-6" />
		</div>
		<div>
			<Image
				alt="side-bar-logo"
				height={48}
				quality={100}
				src="/assets/aris-logo.svg"
				width={48}
			/>		
		</div>
		<div>
			<IoPodiumOutline className="h-6 w-6" />
		</div>
		<div>
			<FaRegBookmark className="h-6 w-6" />
		</div>
	</div>)
}

export default BottomNav
