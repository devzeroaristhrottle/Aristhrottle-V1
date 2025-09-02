import Navbar from '@/components/Navbar'
import UploadMeme from '@/components/UploadMeme'
import Sidebar from '../home/sidebar/Sidebar'
import { GoogleAnalytics } from '@next/third-parties/google'

interface Props {
	children: React.ReactNode
}

export default function Layout({ children }: Props) {
	const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-FY44ED1KLP'

	return (
		<div className="bg1 min-h-screen flex flex-col">
			{/* Remove sticky wrapper - Navbar handles its own fixed positioning */}
			<Navbar />
			
			<div className="flex flex-1">
				{/* Sidebar - only visible on large screens */}
				<aside className="w-20 h-screen sticky top-0 lg:block hidden z-50">
					<Sidebar />
				</aside>

				{/* Main content */}
				<main className="flex-1 md:px-8 lg:px-20">
					<div className="mt-2 md:mt-6">{children}</div>
				</main>
			</div>

			{/* Bottom sidebar for small devices */}
			<div className="lg:hidden block h-16">
				<Sidebar />
			</div>

			<UploadMeme />
			<GoogleAnalytics gaId={gaId} />
		</div>
	)
}