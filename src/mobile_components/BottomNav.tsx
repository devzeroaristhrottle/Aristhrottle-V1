import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { FaRegBookmark } from 'react-icons/fa'
import { GrCloudUpload } from 'react-icons/gr'
import { IoPodiumOutline } from 'react-icons/io5'
import { LuTrophy } from 'react-icons/lu'

function BottomNav() {
	return (
	<div className="bottom-0 w-full bg-black/90 py-3 flex flex-row justify-evenly items-center">
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
		<Link href="/mobile/saved">
			<FaRegBookmark className="h-6 w-6" />
		</Link>
	</div>)
}

export default BottomNav
