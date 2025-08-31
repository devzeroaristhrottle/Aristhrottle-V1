import React from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'
import { dummyAccounts, dummyTags } from './dummy'
import RegionSelect from './RegionSelect'

function PopularView() {
    return (
        <div>
            <div className='h-5'></div>

            <div className='flex flex-row justify-between font-bold text-base'>
                Regional
                <RegionSelect />
            </div>
            <Tags tags={dummyTags}/>

            <div className='h-5'></div>

            <div className='flex flex-row justify-between font-bold text-base'>
                People Trending Regionally
                <RegionSelect />
            </div>
            <Accounts accounts={dummyAccounts}/>
        </div>
    )
}

export default PopularView