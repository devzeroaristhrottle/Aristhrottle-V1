import Navbar from '@/components/Navbar'
import UploadMeme from '@/components/UploadMeme'
import Sidebar from './sidebar/Sidebar'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className='bg1'>
      <div className='flex flex-col'>
        <div className='fixed h-screen max-h-dvh !z-[100]'>
          <Sidebar />
        </div>
        <div className='min-h-dvh max-w-screen'>
          <Navbar />
          <div className='mt-2 md:mt-6'>{children}</div>
        </div>
      </div>
      <UploadMeme />
    </div>
  )
}
