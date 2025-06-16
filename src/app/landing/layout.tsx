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
		<div className="bg1">
			<div className="flex flex-col">
				<div className="fixed h-screen max-h-dvh !z-[100]">
					<Sidebar />
				</div>
				<div className="min-h-dvh max-w-screen">
					<Navbar />
					<div className="mt-2 md:mt-6">{children}</div>
				</div>
			</div>
			<UploadMeme />
			<GoogleAnalytics gaId={gaId} />
		</div>
	)
}
