export interface Meme {
	_id: string
	name: string
	image_url: string
	vote_count: number
	is_onchain: boolean
	has_user_voted?: boolean
	bookmarks?: string[]
	bookmark_count?: number
	rank?: number
	created_by?: {
		_id: string
		username: string
		profile_pic?: string
		user_wallet_address?: string
		createdAt?: string
		updatedAt?: string
		__v?: number
	}
	createdAt: string
	updatedAt?: string
	shares?: string[]
	tags?: {
		_id: string
		name: string
		createdAt: string
		updatedAt: string
		__v: number
	}[]
	categories?: string[]
	views?: number
	__v?: number
}

export interface MemeCardProps {
	meme: Meme
	pageType: 'live' | 'all'
	onVote?: (memeId: string) => void
	onShare?: (memeId: string, imageUrl: string) => void
	onBookmark?: (memeId: string, name: string, imageUrl: string) => void
	isBookmarked?: boolean
	onImageClick?: () => void
	onReport?: (memeId: string) => void
	isGridView?: boolean
}

export interface MemesListProps {
	memes: Meme[]
	pageType: 'live' | 'all'
	onVote?: (memeId: string) => void
	onShare?: (memeId: string, imageUrl: string) => void
	onBookmark?: (memeId: string, name: string, imageUrl: string) => void
	bookmarkedMemes?: Set<string>
	view?: 'grid' | 'list'
}


export interface UserLeaderboardItem {
	rank: number
	username: string
	user_wallet_address: string
	votes_received: number
	votes_casted: number
	uploads: number
	tokens_minted: number
	profile_pic: string
}

export interface UserListProps {
	users: UserLeaderboardItem[]
	loading: boolean
}