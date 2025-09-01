import React from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmModalProps } from './types'


function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title = "Confirm Action",
	message = "Are you sure you want to perform this action? This action cannot be undone.",
	confirmButtonText = "Delete",
	cancelButtonText = "Cancel"
}: ConfirmModalProps) {
	if (!isOpen) return null

	return (
		<div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
			<div className="rounded-lg p-6 max-w-sm w-full" style={{backgroundColor: "#707070"}}>
				<h3 className="text-lg font-extrabold mb-4 w-full text-center">
					{title}
				</h3>
				<p className="mb-6">
					{message}
				</p>
				<div className="flex gap-3">
					<Button
						variant="outline"
						onClick={onClose}
						className="flex-1"
					>
						{cancelButtonText}
					</Button>
					<Button
						variant="solid"
						onClick={onConfirm}
						className="flex-1 bg-red-600 hover:bg-red-700 text-white"
					>
						{confirmButtonText}
					</Button>
				</div>
			</div>
		</div>
	)
}

export default ConfirmModal
