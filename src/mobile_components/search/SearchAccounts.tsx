import React, { useState, useContext } from 'react'
import { AccountsProps } from '../types'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import axiosInstance from '@/utils/axiosInstance'
import { Context } from '@/context/contextProvider'
import { useAuthModal } from '@account-kit/react'
import ConfirmModal from '../ConfirmModal'

function Accounts({ accounts }: AccountsProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({})
    const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({})
    const [isConfirmUnfollowOpen, setIsConfirmUnfollowOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const router = useRouter();
    const { userDetails } = useContext(Context)
    const { openAuthModal } = useAuthModal()

    // Check initial follow status for all accounts
    const checkFollowStatus = async () => {
        if (!userDetails?._id) return;
        
        try {
            const response = await axiosInstance.get(`/api/user/follow?userId=${userDetails._id}&type=following`);
            
            if (response.data.users) {
                const followingIds = response.data.users.map((user: any) => user._id);
                const newStatus: { [key: string]: boolean } = {};
                accounts.forEach(account => {
                    newStatus[account._id] = followingIds.includes(account._id);
                });
                setFollowingStatus(newStatus);
            }
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    // Check follow status when accounts or user changes
    React.useEffect(() => {
        checkFollowStatus();
    }, [accounts, userDetails?._id]);

    const handleFollow = async (userId: string) => {
        try {
            if (!userDetails?._id) {
                toast.error('Please login to follow users')
                if (openAuthModal) openAuthModal()
                return
            }

            const isCurrentlyFollowing = followingStatus[userId];
            
            if (isCurrentlyFollowing) {
                // Show confirmation modal for unfollow
                setSelectedUserId(userId);
                setIsConfirmUnfollowOpen(true);
                return;
            }

            // Follow user
            setIsLoading(prev => ({ ...prev, [userId]: true }));
            await axiosInstance.post('/api/user/follow', { userIdToFollow: userId });
            setFollowingStatus(prev => ({ ...prev, [userId]: true }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to update follow status';
            toast.error(errorMessage);
        } finally {
            setIsLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleUnfollow = async () => {
        if (!selectedUserId) return;

        try {
            setIsLoading(prev => ({ ...prev, [selectedUserId]: true }));
            await axiosInstance.delete(`/api/user/follow?userId=${selectedUserId}`);
            setFollowingStatus(prev => ({ ...prev, [selectedUserId]: false }));
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Failed to unfollow user';
            toast.error(errorMessage);
        } finally {
            setIsLoading(prev => ({ ...prev, [selectedUserId]: false }));
            setIsConfirmUnfollowOpen(false);
            setSelectedUserId(null);
        }
    };
    
    if (!accounts || accounts.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[200px] text-gray-400">
                No accounts found
            </div>
        )
    }

    const maxVisibleAccounts = 3
    const visibleAccounts = isExpanded ? accounts : accounts.slice(0, maxVisibleAccounts)
    const hasMoreAccounts = accounts.length > maxVisibleAccounts && !isExpanded

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <div className="space-y-2 py-2">
            <div className="space-y-3">
                {visibleAccounts.map((account) => (
                    <div key={account._id} className="flex items-center gap-3 rounded-lg" >
                        {/* Profile Picture */}
                        <div className="flex items-center justify-center" onClick={() => router.push(`/mobile/profile/${account._id}`)}>
                            <img
                                src={account.profile_pic}
                                alt={account.username}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        </div>
                        
                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                            {/* Username and Follow Button */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-extrabold text-sm truncate">
                                    {account.username}
                                </h3>
                                
                            </div>
                            
                            {/* Bio */}
                            <p className=" text-sm truncate" style={{fontSize: '0.5rem'}}>
                                {account.bio.length > 50 ? `${account.bio.substring(0, 50)}...` : account.bio}
                            </p>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-400" style={{fontSize: '0.5rem'}}>
                                <span className="flex items-center gap-1">
                                    <span className="font-medium text-white">{account.followers.toLocaleString()}</span>
                                    <span>followers</span>
                                </span>
                                <span className="flex items-center gap-1" style={{fontSize: '0.5rem'}}>
                                    <span className="font-medium text-white" >{account.following.toLocaleString()}</span>
                                    <span>following</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFollow(account._id);
                                }}
                                disabled={isLoading[account._id]}
                                className={`flex justify-between items-center gap-2 p-1 rounded-md font-medium transition-colors text-black ${
                                    followingStatus[account._id]
                                        ? 'bg-[#707070]'
                                        : 'bg-[#2FCAC7]'
                                } ${isLoading[account._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{fontSize: '0.75rem'}}
                            >
                                {isLoading[account._id] ? (
                                    <div className="w-3 h-3 border-t-2 border-b-2 border-black rounded-full animate-spin" />
                                ) : followingStatus[account._id] ? (
                                    'Following'
                                ) : (
                                    'Follow'
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {hasMoreAccounts && (
                <button
                    onClick={toggleExpanded}
                    className="bg-[#2FCAC7] transition-colors rounded-md text-black px-2 mt-2 text-base"
                >
                    More
                </button>
            )}
            
            {isExpanded && accounts.length > maxVisibleAccounts && (
                <button
                    onClick={toggleExpanded}
                    className="bg-[#2FCAC7] transition-colors rounded-md text-black px-2 mt-2"
                >
                    Show less
                </button>
            )}

            {/* Confirm Unfollow Modal */}
            <ConfirmModal
                isOpen={isConfirmUnfollowOpen}
                onClose={() => {
                    setIsConfirmUnfollowOpen(false);
                    setSelectedUserId(null);
                }}
                onConfirm={handleUnfollow}
                title="Confirm Unfollow"
                message={`Are you sure you want to unfollow ${
                    selectedUserId 
                        ? accounts.find(a => a._id === selectedUserId)?.username 
                        : 'this user'
                }?`}
                confirmButtonText="Unfollow"
            />
        </div>
    )
}

export default Accounts