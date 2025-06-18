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
		<div className="bg1 min-h-screen flex">
			{/* Sidebar */}
			<aside className="w-20 h-screen top-0 lg:block hidden">
				<Sidebar />
			</aside>

			{/* Main content */}
			<main className="flex-1 md:px-8 lg:px-20">
				<Navbar />
				<div className="mt-2 md:mt-6">{children}</div>
				<div className="lg:hidden block">
					<Sidebar />
				</div>
			</main>

			<UploadMeme />
			<GoogleAnalytics gaId={gaId} />
		</div>
	)
}
