import React from 'react'
import Accounts from './SearchAccounts'
import Tags from './SearchTags'
import { dummyAccounts, dummyTags } from './dummy'
import RegionSelect from './RegionSelect'

function TrendingView() {
    return (
        <div>
            <div>Global</div>
            <Tags showRank={true} tags={dummyTags}/>

            <div className='flex flex-row justify-between'>
                Regional
                <RegionSelect />
            </div>
            <Tags showRank={true} tags={dummyTags}/>

            <div>People Trending Worldwide</div>
            <Accounts accounts={dummyAccounts}/>

            <div className='flex flex-row justify-between'>
                People Trending Regionally
                <RegionSelect />
            </div>
            <Accounts accounts={dummyAccounts}/>
        </div>
    )
}

export default TrendingView