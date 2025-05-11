'use client'

import { Tag } from '@/components/ui/tag'
import UploadMeme from '@/components/UploadMeme'
import { useRef, useState } from 'react'
import { CgProfile } from 'react-icons/cg'
import { HiPlus } from 'react-icons/hi'

interface FormData {
  title: string
  tags: string[]
  category: string
  file: File | null
}

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    tags: ['Jokes', 'Abstract', 'Meme'],
    category: '',
    file: null,
  })
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    console.log(dragActive)
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (
      file.size <= 10 * 1024 * 1024 &&
      ['image/jpeg', 'image/png'].includes(file.type)
    ) {
      setFormData((prev) => ({ ...prev, file }))
    } else {
      alert('Please select a JPG or PNG file under 10MB')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.file) {
      alert('Please select a file')
      return
    }

    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!formData.category) {
      alert('Please select a category')
      return
    }

    const submitData = new FormData()
    submitData.append('file', formData.file)
    submitData.append('title', formData.title)
    submitData.append('tags', JSON.stringify(formData.tags))
    submitData.append('category', formData.category)

    try {
      // Replace with your API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: submitData,
      })

      if (response.ok) {
        alert('Upload successful!')
        handleCancel()
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      alert('Error uploading file: ' + error)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: '',
      tags: [],
      category: '',
      file: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className='bg-gray-800 border-2 border-white w-1/3 mx-auto py-8'>
      <form onSubmit={handleSubmit}>
        <div className='flex items-center gap-2 mb-1 px-28'>
          <CgProfile />
          <span className='text-gray-300'>{'Username'}</span>
        </div>

        <div
          className='bg-white p-4 mb-6 mx-28'
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className='border-2 border-dashed border-[#1783fb] p-8'>
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              accept='.jpg,.jpeg,.png'
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
            <div className='flex flex-col items-center text-center'>
              <UploadMeme />
              <h3 className='text-black text-2xl font-semibold'>
                Select a file
              </h3>
              <p className='text-gray-400 text-base font-medium'>
                JPG, PNG / Max. 10 MB
              </p>
            </div>
          </div>
        </div>

        <div className='flex gap-2 text-2xl px-12'>
          <span className='text-[#1783fb] text-3xl'>Title:</span>
          <input
            type='text'
            placeholder='Max 100 characters'
            className='w-full rounded px-2 text-white text-base border-2 border-[#1783fb] bg-gray-800'
            maxLength={100}
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>
        <div className='flex gap-2 text-2xl mt-4 px-12'>
          <span className='text-[#1783fb] text-3xl'>Tags:</span>
          <div className='flex flex-col w-full'>
            <input
              type='text'
              placeholder='Max 5 tags'
              className='w-full rounded px-2 text-white text-base border-2 border-[#1783fb] bg-gray-800'
              maxLength={100}
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <div className='flex gap-3 mt-2'>
              {formData?.tags?.map((tag, index: number) => {
                return (
                  <Tag
                    key={index}
                    className='bg-gray-800 border-2 border-[#1783fb] rounded-lg cursor-pointer'
                    endElement={<HiPlus />}
                    size={'sm'}
                  >
                    {tag}
                  </Tag>
                )
              })}
            </div>
          </div>
        </div>

        <div className='flex gap-2 text-3xl mt-4 px-12'>
          <span className='text-[#1783fb]'>Category:</span>
          <select
            className='bg-gray-800 text-gray text-base px-1 rounded w-2/5 border-2 border-[#1783fb]'
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            <option value=''>Select</option>
            <option value='Abstract'>Abstract</option>
            <option value='Nature'>Nature</option>
            <option value='Urban'>Urban</option>
          </select>
        </div>

        <div className='flex justify-center gap-10 mt-6'>
          <button
            type='button'
            onClick={handleCancel}
            className='px-3 py-1 text-red-500 font-semibold rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white transition-colors'
          >
            Cancel
          </button>
          <button
            type='submit'
            className='px-3 py-1 text-black font-semibold rounded-full bg-[#29e0ca] hover:text-white hover:bg-transparent hover:border hover:border-white transition-colors'
          >
            Upload
          </button>
        </div>
      </form>
    </div>
  )
}
