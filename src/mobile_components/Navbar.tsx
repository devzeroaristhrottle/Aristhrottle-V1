'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import {
	DialogBody,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogRoot,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { defineStyle, Input, Popover, Portal } from '@chakra-ui/react'
import axiosInstance from '@/utils/axiosInstance'
import { Avatar } from '@/components/ui/avatar'
import { toast } from 'react-toastify'
import { Context } from '@/context/contextProvider'
import { useRouter } from 'next/navigation'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

import Notifications from '../components/Notifications'
import useCountdown from '@/app/hooks/useCountdown'
import {
	useAuthModal,
	useLogout,
	useUser,
	useSigner,
	useSmartAccountClient,
	useSignMessage,
} from '@account-kit/react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { ethers } from 'ethers'

export default function Navbar() {
	const [isOpenModel, setIsOpenModel] = useState<boolean>(false)
	const [username, setUsername] = useState<string>('')
	const [bio, setBio] = useState<string>('')
	const ref = useRef<HTMLInputElement>(null)
	const { setUserDetails, userDetails } = useContext(Context)
	const [loading, setLoading] = useState<boolean>(false)
	const [referralCode, setReferralCode] = useState<string>('')

	const user = useUser()
	const { openAuthModal } = useAuthModal()
	const { logout } = useLogout()

	const signer = useSigner()

	const message = 'signUsingAlchemyWallet'
	const { client, address } = useSmartAccountClient({})
	const [open, setOpen] = useState(false)

	const { signMessageAsync, isSigningMessage } = useSignMessage({
		client,
		// these are optional
		onSuccess: () => {},
		onError: error => console.error(error),
	})

	const route = useRouter()
	const timeLeft = useCountdown()
	const ringCss = defineStyle({
		outlineWidth: '2px',
		outlineColor: 'colorPalette.500',
		outlineOffset: '2px',
		outlineStyle: 'solid',
	})

	useEffect(() => {
		const signCheck = async () => {
			if (user && !isSigningMessage) {
				let signature
				if (user.email && signer) {
					signature = await signer.signMessage(message)
				} else {
					signature = await signMessageAsync({ message: message })
				}

				if (signature && user && user.address) {
					await signIn('credentials', {
						message,
						signature,
						wallet: user.address,
						redirect: false, // optional
					})
				}
			}
		}
		signCheck()
	}, [user])

	useEffect(() => {
		const getAccount = async () => {
			if (user && user.address) {
				const res = await axiosInstance.get(`/api/user?wallet=${user.address}`)
				if (res.status == 200 && res.data.error === 'User not found') {
					setIsOpenModel(true)
				}
				let genCount = 0
				if (res.data.user.generations) genCount = res.data.user.generations
				if (res.status == 200 && res.data) {
					setUserDetails({
						...res.data.user,
						...res.data,
						totalVotesReceived: res.data.totalVotesReceived[0]
							? res.data.totalVotesReceived[0].totalVotes
							: 0,
						generations: genCount,
					})
				}
			}
		}
		getAccount()
	}, [user, setUserDetails])

	const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUsername(e.target.value)
	}

	const handleBio = (e: React.ChangeEvent<HTMLInputElement>) => {
		setBio(e.target.value)
	}

	const handleReferralCode = (e: React.ChangeEvent<HTMLInputElement>) => {
		setReferralCode(e.target.value)
	}

	const handleSave = async () => {
		try {
			if (user) {
				const formData = new FormData()
				formData.append('username', username)
				formData.append('user_wallet_address', user.address)
				formData.append('referral_code', referralCode)
				formData.append('bio', bio)
				formData.append('tags', JSON.stringify([]))

				const response = await axiosInstance.post(`/api/user`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				})
				if (response.status == 201) {
					toast.success('Your account has been created')
					setUserDetails(response.data.user)
					setIsOpenModel(false)
				}
			}
			setLoading(true)
		} catch (error) {
			console.log(error, 'Error')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="sticky top-0 z-50 backdrop-blur-md bg-black/20">
			<div className="relative w-[100%] pr-4 md:pr-8">
				<div className="flex justify-between align-middle items-center py-3 md:py-0">
					<div className="flex align-middle items-center gap-5">
						{userDetails && user != null && user.address && (
							<div className="flex gap-5">
								<Avatar
									name="Random"
									colorPalette="blue"
									src={userDetails.profile_pic}
									css={ringCss}
									className="ml-5 cursor-pointer"
									size={'xs'}
									onClick={() => {
										route.replace('/home/profile')
									}}
								/>
							</div>
						)}
					</div>

					<div className="flex items-center justify-center gap-4">
						
						{/* <ConnectButton /> */}
						{/* TODO: on hover add eArt Balance */}
						{user?.address ? (
							<div className="flex items-center justify-center gap-2">
								<Image
									className="!w-10 !h-10"
									alt="icon"
									src="/assets/token_e.png"
									height={24}
									width={24}
								/>
								<span className="text-sm">
									{' '}
									{userDetails?.mintedCoins
										? ethers.formatEther(userDetails.mintedCoins)
										: 0}
									{' $eART'}
								</span>
							</div>
						) : null}
						<Notifications />
					</div>
				</div>
				{userDetails && user != null && user.address && (
					<div className="flex flex-row justify-evenly" style={{fontSize: "12px"}}>
						<div className="flex gap-1 items-center">
							<label>Vote</label>
							<p className="border border-white rounded-md p-1">
								{userDetails.votes}/20
							</p>
						</div>
						<div className="flex gap-1 items-center">
							<label>Upload</label>
							<p className="border border-white rounded-md p-1">
								{userDetails.uploads}/20
							</p>
						</div>
						<div className="flex gap-1 items-center">
							<label>Create</label>
							<p className="border border-white rounded-md p-1">
								{userDetails.generations}/5
							</p>
						</div>
						<div className="flex gap-1 items-center">
							<label>Next phase</label>
							<p className="border border-white w-[80px] text-center rounded-md p-1">
								{timeLeft}
							</p>
						</div>
					</div>
				)}

				<DialogRoot
					open={isOpenModel}
					motionPreset="slide-in-bottom"
					initialFocusEl={() => ref.current}
				>
					{/* Improved, conditional backdrop blur */}
					{isOpenModel && (
						<div className="fixed inset-0 z-0 backdrop-blur-2xl bg-black/40 pointer-events-none w-screen h-screen" />
					)}
					<DialogContent className="relative z-10 mx-4 md:mx-0 bg-black p-6 rounded-lg border border-white text-lg">
						<DialogHeader>
							<DialogTitle className="text-3xl">Create Account</DialogTitle>
						</DialogHeader>
						<DialogBody>
							<Field label="Account Address">
								<Input
									className="px-2 bg-gray-800"
									variant="subtle"
									placeholder="Enter Username"
									value={user?.address}
									readOnly
								/>
							</Field>
							<Field label="Username" className="mt-3">
								<Input
									ref={ref}
									className="px-2 bg-gray-800"
									variant="subtle"
									placeholder="Enter Username"
									value={username}
									onChange={e => handleUsername(e)}
								/>
							</Field>
							<Field label="Bio" className="mt-3">
								<Input
									ref={ref}
									className="px-2 bg-gray-800"
									variant="subtle"
									placeholder="Enter Bio"
									value={bio}
									height={'150px'}
									onChange={e => handleBio(e)}
								/>
							</Field>
							<Field label="Referral Code" className="mt-3 mb-5">
								<Input
									className="px-2 w-full bg-gray-800"
									variant="subtle"
									placeholder="Enter Referral Code"
									value={referralCode}
									maxLength={6}
									onChange={e => handleReferralCode(e)}
								/>
							</Field>
						</DialogBody>
						<DialogFooter>
							<Button
								disabled={loading}
								variant="solid"
								className={'bg-[#192666] px-4 py-2 hover:bg-blue-900'}
								onClick={handleSave}
							>
								{loading ? (
									<AiOutlineLoading3Quarters className="text-white animate-spin" />
								) : (
									'Save'
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</DialogRoot>
			</div>
		</div>
	)
}
