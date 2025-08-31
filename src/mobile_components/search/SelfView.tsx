import React from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'
import MemesList from '../MemesList'
import { dummyAccounts, dummyTags, dummyMemes } from './dummy'
function SelfView() {

    return (
        <div>
            <div>Tags</div>
            <Tags tags={dummyTags} />

            <div>Suggested Accounts</div>
            <Accounts accounts={dummyAccounts} />

            <div>Content</div>
            <MemesList pageType='all' view='grid' memes={dummyMemes}/>
        </div>
    )
}

export default SelfView