import React from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'
import { dummyAccounts, dummyTags } from './dummy'
import RegionSelect from './RegionSelect'

function PopularView() {
    return (
        <div>
            <div>Global</div>
            <Tags tags={dummyTags}/>

            <div className='flex flex-row justify-between'>
                Regional
                <RegionSelect />
            </div>
            <Tags tags={dummyTags}/>

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

export default PopularView