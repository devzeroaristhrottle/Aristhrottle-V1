import { Button } from '@/components/ui/button'
import { LiaSortSolid } from 'react-icons/lia'
import { IoGridOutline } from 'react-icons/io5'

import React from 'react'

function Sorter() {
	return (
		<div className="flex flex-row justify-between p-3">
			<div id="sorting_selector">
				<Button
					size={{ sm: 'xs', md: 'sm' }}
					variant="outline"
					className="border-2 px-1 rounded-lg gap-2"
				>
					<LiaSortSolid />
					Sort
				</Button>
			</div>
			<div id="new_or_grid_buttons" className="flex flex-row gap-2">
				<IoGridOutline className="h-full" />
			</div>
		</div>
	)
}

export default Sorter
