import { Button } from '@/components/ui/button'
import { LiaSortSolid } from 'react-icons/lia'
import { IoGridOutline, IoListOutline } from 'react-icons/io5'


function Sorter({ gridEnable, onViewChange, view = 'grid' } : { gridEnable? : boolean, view?: 'grid' | 'list', onViewChange?: (view: 'grid' | 'list') => void}) {
	return (
		<div className="flex flex-row justify-between p-3">
			<div id="sorting_selector">
				<Button
					size={{ sm: 'xs', md: 'sm' }}
					variant="outline"
					className="border-2 px-1 rounded-lg gap-2 text-sm"
				>
					<LiaSortSolid />
					Sort
				</Button>
			</div>
			<div id="new_or_grid_buttons" className="flex flex-row gap-2 items-center" hidden={!gridEnable}>
				<button
					onClick={() => onViewChange?.(view === 'grid' ? 'list' : 'grid')}
					className="p-2 hover:text-blue-400 transition-colors"
				>
					{view === 'grid' ? (
						<IoListOutline className="w-5 h-5" />
					) : (
						<IoGridOutline className="w-5 h-5" />
					)}
				</button>
			</div>
		</div>
	)
}

export default Sorter
