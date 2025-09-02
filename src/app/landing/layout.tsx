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
		<>
			{/* Navbar - Fixed on mobile, Sticky on desktop */}
			<Navbar />
			
			{/* Desktop Layout */}
			<div className="hidden lg:flex bg1 min-h-screen flex-col">
				<div className="flex flex-1">
					{/* Sidebar - only visible on large screens */}
					<aside className="w-20 h-screen sticky top-0 z-50">
						<Sidebar />
					</aside>

					{/* Main content for desktop */}
					<main className="flex-1 md:px-8 lg:px-20">
						<div className="mt-2 md:mt-6">{children}</div>
					</main>
				</div>
			</div>

			{/* Mobile Layout - Uses dynamic navbar height */}
			<div className="lg:hidden bg1 min-h-screen">
				{/* Use CSS custom property for dynamic navbar height */}
				<div 
  className=" pb-20" 
  style={{ paddingTop: 'var(--navbar-height, 140px)' }}
>
					<main className="w-full">
						{children}
					</main>
				</div>
			</div>

			{/* Bottom sidebar for small devices */}
			<div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16">
				<Sidebar />
			</div>

			<UploadMeme />
			<GoogleAnalytics gaId={gaId} />
		</>
	)
}