import { HiCheckCircle } from 'react-icons/hi'
import { CgCloseO } from 'react-icons/cg'
import { useRouter } from 'next/navigation'

interface UploadSuccessProps {
  setOpenUploadSuccess: (value: boolean) => void
}

export default function UploadSuccess({
  setOpenUploadSuccess,
}: UploadSuccessProps) {
  const router = useRouter()
  const handleView = () => {
    setOpenUploadSuccess(false)
    router.push('/home/profile')
  }
  return (
    <div className='fixed inset-0 backdrop-blur-md flex justify-center items-center z-50'>
      <div className='w-80 md:w-96 md:h-36 bg-[#0c294d] text-white shadow-lg rounded-md  border-2 border-[#1783fb] relative'>
        <CgCloseO
          onClick={() => setOpenUploadSuccess(false)}
          className='z-50 absolute -top-5 -right-4 md:-top-6 md:-right-5 text-white w-5 h-5'
        />
        <div className='flex justify-center items-center gap-x-2 md:gap-x-3 mt-7 md:mt-10 md:px-10 mb-5'>
          <HiCheckCircle className='text-green-400 text-xl' />
          <span className='text-lg font-semibold text-[#1783fb]'>
            Your meme uploaded successfully
          </span>
        </div>
        <div className='flex justify-end items-center gap-x-3 my-2 mr-4 mb-2'>
          <button
            onClick={() => handleView()}
            className='text-sm font-medium border border-white rounded-md px-2'
          >
            View
          </button>
        </div>
      </div>
    </div>
  )
}
