'use client'
import { useRouter } from 'next/navigation'
import Page from './story/page'
import { useEffect } from 'react'

export default function Home() {
	const router = useRouter()
	useEffect(() => router.push('/landing'), [])
	return (
		<div className="text-center">
			<Page />
		</div>
	)
}
