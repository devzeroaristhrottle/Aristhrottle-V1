'use client'

import { useContext, useEffect, useState } from 'react'
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogRoot,
  Field,
  Input,
} from '@chakra-ui/react'
import { CgCloseO, CgProfile } from 'react-icons/cg'
import {
  FileUploadDropzone,
  FileUploadList,
  FileUploadRoot,
} from './ui/file-upload'
import { HiPlus } from 'react-icons/hi'
import { Tag } from './ui/tag'
import { IoIosClose } from 'react-icons/io'
import { Button } from './ui/button'
import UploadSuccess from './UploadSuccess'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { ImCancelCircle } from 'react-icons/im'
import { toast } from 'react-toastify'

interface Tags {
  name: string
  isNew?: boolean
  _id?: string
  id?: string
}

interface TagRes {
  name: string
  _id: string
}

export default function UploadModal() {
  const [isOpenUploadSuccess, setOpenUploadSuccess] = useState(false)

  const [title, setTitle] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tags[]>([])
  const [filteredTags, setFilteredTags] = useState<Tags[]>([])
  const [newTagInput, setNewTagInput] = useState('')
  const [tags, setTags] = useState<Tags[]>([])
  const [meme, setMeme] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<string>()

  const [error, setError] = useState({
    title: '',
    categories: '',
    tags: '',
    file: '',
  })
  const {
    userDetails,
    isUploadMemeOpen,
    setIsUploadMemeOpen,
    setIsRefresh,
    isRefreshMeme,
  } = useContext(Context)

  useEffect(() => {
    getTag()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      findTag()
    }, 400)
    return () => {
      clearTimeout(timer)
    }
  }, [newTagInput])

  const findTag = async () => {
    if (newTagInput.length > 0) {
      const response = await axiosInstance.get(`/api/tags?name=${newTagInput}`)

      if (response.data.tags) {
        setFilteredTags([...response.data.tags])
      }
    } else {
      setFilteredTags([])
    }
  }

  const getTag = async () => {
    const response = await axiosInstance.get('/api/tags')

    if (response.data.tags) {
      const tags: Tags[] = []

      response.data.tags.map((tag: TagRes) => {
        tags.push({ name: tag.name, _id: tag._id, isNew: false })
      })
      setTags([...tags])
    }
  }

  const handleTagSelect = (tag: string, isNew: boolean, id: string) => {
    if (selectedTags.length >= 5) return

    if (!selectedTags.some((t) => t.name === tag)) {
      setSelectedTags((prev) => [...prev, { name: tag, isNew: isNew, id: id }])
    }
  }

  const handleNewTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.key === 'Enter' || e.key === 'Tab') &&
      newTagInput.trim() &&
      selectedTags.length < 5 &&
      filteredTags.length == 0
    ) {
      if (!selectedTags.some((tag) => tag.name === newTagInput.trim())) {
        setSelectedTags((prev) => [
          ...prev,
          { name: newTagInput.trim(), isNew: true, _id: undefined },
        ])
        setNewTagInput('')
      }
    }
  }

  const removeTag = (tagTitle: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag.name !== tagTitle))
  }

  const handleClose = () => {
    setTitle('')
    setSelectedTags([])
    setNewTagInput('')
    setMeme(null)
    setSelectedImage(undefined)
    setIsUploadMemeOpen(false)
  }

  const handleUpload = async () => {
    await uploadMeme()
  }

  const uploadMeme = async () => {
    const errors = {
      title: '',
      categories: '',
      tags: '',
      file: '',
    }

    if (!meme) {
      errors.file = 'Please select a file'
    }

    if (title.length === 0 || title.length > 100) {
      errors.title = 'Title is not valid'
    }

    if (selectedTags.length === 0) {
      errors.tags = 'Please select at least one tag'
    }

    setError({ ...errors })
    const loadId = toast.loading("Uploading meme....")

    try {
      setLoading(true)
      if (
        userDetails?._id &&
        meme &&
        title.length > 0 &&
        title.length < 100 &&
        selectedTags.length > 0 &&
        selectedTags.length <= 5
      ) {
        
        const formData = new FormData()
        formData.append('created_by', userDetails._id)
        formData.append('name', title)
        formData.append('file', meme)

        const newTags: string[] = []
        const existingTags: string[] = []

        selectedTags.forEach((tag) => {
          if (tag.isNew) {
            newTags.push(tag.name)
          } else {
            if (!tag.isNew && tag.id) {
              existingTags.push(tag.id)
            }
          }
        })

        formData.append('new_tags', JSON.stringify(newTags))
        formData.append('existing_tags', JSON.stringify(existingTags))
        const response = await axiosInstance.post('/api/meme', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        if (response.status == 201) {
          setIsRefresh(!isRefreshMeme)
          setIsUploadMemeOpen(false)
          toast.update(loadId, { render: "Meme Upload SuccessFul", type: "success", isLoading: false, autoClose: 5000})
          setSelectedTags([])
          setTitle('')
        }

        if (response.status == 200) {
          toast.update(loadId, { render: 'Upload failed. Please select another meme and try again.', type: "error", isLoading: false, autoClose: 5000})
        }
      }
    } catch (error) {
      setLoading(false)
      console.log(error)
      toast.update(loadId, { render: 'Upload failed. Please select another meme and try again.', type: "error", isLoading: false, autoClose: 5000})
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogRoot open={isUploadMemeOpen} motionPreset='slide-in-bottom'>
        <DialogBackdrop className='backdrop-blur-md' />
        <DialogContent className='fixed inset-1 md:inset-10  bg-[#141e29] border border-white w-[90vw] md:w-[70vw] h-[70vh] md:h-[80vh] max-w-none p-0 mx-auto'>
          <DialogBody className='overflow-y-auto'>
            <CgCloseO
              onClick={() => {
                setMeme(null)
                setSelectedImage(undefined)
                setIsUploadMemeOpen(false)
              }}
              className='z-50 absolute -top-5 md:-top-6 -right-4 text-white w-5 h-5 cursor-pointer'
            />
            <div className='flex flex-col md:flex-row gap-x-10 md:px-4 md:pt-14'>
              {/* Left Side - Upload Area */}
              <div className='col-span-5 flex flex-col'>
                <div className='flex items-center gap-1 mb-1 md:mb-2'>
                  <CgProfile size={36} className='w-5 h-5 md:w-9 md:h-9' />
                  <span className='text-[#29e0ca] text-xl md:text-2xl'>
                    {userDetails?.username}
                  </span>
                </div>
                <FileUploadRoot
                  alignItems='stretch'
                  maxFiles={1}
                  maxFileSize={2097152}
                  accept={['image/png', 'image/jpg', 'image/jpeg']}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedImage(URL.createObjectURL(e.target.files[0]))
                      setMeme(e.target.files[0])
                    }
                  }}
                >
                  <div className='bg-white h-full md:h-[430px] md:w-[450px] p-2 md:p-6'>
                    {selectedImage ? (
                      <img src={selectedImage} className='h-full  rounded-md' />
                    ) : (
                      <FileUploadDropzone
                        className='bg-white border-2 border-dashed border-[#1681fa] h-full'
                        label='Select a file'
                        description='JPG, PNG / Max. 2 MB'
                      />
                    )}
                  </div>
                  <p className='text-red-400 text-xs md:text-lg'>
                    {error.file}
                  </p>
                  {selectedImage && (
                    <div className='flex gap-x-2 md:gap-x-4 items-center'>
                      <FileUploadList className='w-[300px] md:w-[380px] border-none outline-none' />
                      <ImCancelCircle
                        className='text-lg'
                        onClick={() => {
                          setSelectedImage(undefined)
                          setMeme(null)
                        }}
                      />
                    </div>
                  )}
                </FileUploadRoot>
              </div>

              {/* Right Side - Form */}
              <div className='col-span-7 flex flex-col mt-3  md:mt-7'>
                <Field.Root invalid={error.title.length > 0}>
                  <div className='flex flex-row md:flex-col gap-x-1 md:gap-y-1 w-full'>
                    <Field.Label className='text-[#1783fb] text-xl md:text-4xl'>
                      Title:
                    </Field.Label>
                    <Input
                      type='text'
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                      placeholder='Max 100 characters'
                      className='w-full rounded-md outline-none px-1 md:px-2 md:py-1 text-white text-xl md:text-2xl border-2 border-[#1783fb] bg-gray-800'
                      maxLength={100}
                      size={{ sm: 'sm', md: 'md', lg: 'lg' }}
                    />
                    <Field.ErrorText className='text-xs md:text-base'>
                      {error.title}
                    </Field.ErrorText>
                  </div>
                </Field.Root>

                <div className='flex flex-col gap-y-2 md:gap-4 mt-5 md:mt-10'>
                  <div className='w-full relative'>
                    <Field.Root invalid={error.tags.length > 0}>
                      <div className='flex flex-row md:flex-col gap-x-1 md:gap-y-1 w-full '>
                        <Field.Label className='text-[#1783fb] text-xl md:text-4xl'>
                          Tags:
                        </Field.Label>
                        <Input
                          type='text'
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={handleNewTag}
                          placeholder='Max 5 tags'
                          className='w-full rounded-md outline-none px-1 md:px-2 md:py-1 text-white text-xl md:text-2xl border-2 border-[#1783fb] bg-gray-800'
                          disabled={selectedTags.length >= 5}
                          size={{ sm: 'sm', md: 'md', lg: 'lg' }}
                        />
                        <Field.ErrorText className='text-xs md:text-base'>
                          {error.tags}
                        </Field.ErrorText>
                      </div>
                    </Field.Root>

                    {filteredTags && newTagInput.length > 0 && (
                      <div className='absolute w-full z-10  bg-[#081533] border border-[#1783fb] rounded-2xl max-h-52 overflow-y-auto mt-2 p-4 space-x-1 md:space-x-3'>
                        {filteredTags.map((tag, index) => (
                          <Tag
                            key={index}
                            className='bg-blue-500 rounded-lg cursor-pointer text-balance md:py-1 md:px-2'
                            size={{ sm: 'sm', md: 'lg' }}
                            onClick={() => {
                              if (tag._id) {
                                handleTagSelect(tag.name, false, tag._id)
                                setNewTagInput('')
                              }
                            }}
                          >
                            {tag.name}
                          </Tag>
                        ))}
                        {filteredTags.length === 0 && (
                          <div className='px-4 py-2 text-gray-400'>
                            No recommendations found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Tags */}
                  <div className='flex items-center flex-wrap gap-2 md:gap-4 max-h-14 md:max-h-28 overflow-y-auto no-scrollbar whitespace-nowrap'>
                    {selectedTags.map((tag, index) => (
                      <Tag
                        key={index}
                        className='bg-blue-500 rounded-lg cursor-pointer text-balance px-2 md:py-1'
                        endElement={
                          <IoIosClose
                            className='w-3 h-3 md:w-3.5 md:h-3.5 ml-1 md:ml-0'
                            onClick={() => removeTag(tag.name)}
                          />
                        }
                        size={{ sm: 'sm', md: 'md', lg: 'lg' }}
                      >
                        {tag.name}
                      </Tag>
                    ))}
                  </div>

                  {/* Sample Tags */}
                  <div className='flex items-center flex-wrap gap-2 md:gap-4 max-h-14 md:max-h-36 overflow-y-auto no-scrollbar whitespace-nowrap'>
                    {tags.map((tag, index) => (
                      <Tag
                        key={index}
                        className={`bg-gray-800 border-2 border-[#1783fb] hover:opacity-50 rounded-lg cursor-pointer px-2 md:py-1`}
                        onClick={() => {
                          if (tag._id) {
                            handleTagSelect(tag.name, false, tag._id)
                          }
                        }}
                        endElement={
                          <HiPlus className='w-3 h-3 md:w-3.5 md:h-3.5 ml-1 md:ml-0' />
                        }
                        size={{ sm: 'sm', md: 'md', lg: 'lg' }}
                      >
                        {tag.name}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div className='flex justify-center gap-x-5 md:gap-x-10 mt-5 md:mt-10'>
                  <Button
                    type='button'
                    onClick={handleClose}
                    className='px-3 md:px-5 md:py-1 !h-7 md:!h-9 text-base md:text-lg text-red-500 font-semibold rounded-xl border border-red-500 hover:bg-red-500 hover:text-white transition-colors'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    onClick={handleUpload}
                    loading={loading}
                    loadingText={'Loading...'}
                    disabled={loading}
                    className='px-3 md:px-5 md:py-1 !h-7 md:!h-9 text-base md:text-lg text-black disabled:cursor-wait font-semibold rounded-xl bg-[#29e0ca] hover:text-white hover:bg-transparent hover:border hover:border-white transition-colors'
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </DialogRoot>

      {isOpenUploadSuccess && (
        <UploadSuccess setOpenUploadSuccess={setOpenUploadSuccess} />
      )}
    </>
  )
}
