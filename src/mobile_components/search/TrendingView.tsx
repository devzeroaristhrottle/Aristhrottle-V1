import React from 'react'
import Accounts from './SearchAccounts'
import Tags from './SearchTags'
import { dummyAccounts, dummyTags } from './dummy'
import RegionSelect from './RegionSelect'

function TrendingView() {
    return (
        <div>
            <div className='flex flex-row justify-between font-bold text-base'>
                Regional
                <RegionSelect />
            </div>
            <Tags showRank={true} tags={dummyTags}/>

            <div className='h-5'></div>
            <div className='flex flex-row justify-between font-bold text-base'>
                People Trending Regionally
                <RegionSelect />
            </div>
            <Accounts accounts={dummyAccounts}/>
        </div>
    )
}

export default TrendingView