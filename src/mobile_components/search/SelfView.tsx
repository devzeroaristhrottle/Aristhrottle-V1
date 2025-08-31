import React from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'
import MemesList from '../MemesList'
import { dummyAccounts, dummyTags, dummyMemes } from './dummy'
function SelfView() {

    return (
        <div>
            <div className='font-bold text-base'>Tags</div>
            <Tags tags={dummyTags} />

            <div className='h-5'></div>

            <div className='font-bold text-base'>Suggested Accounts</div>
            <Accounts accounts={dummyAccounts} />

            <div className='h-5'></div>

            <div className='font-bold text-base'>Content</div>
            <MemesList pageType='all' view='grid' memes={dummyMemes}/>
        </div>
    )
}

export default SelfView