import React from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'

function SelfView() {
    return (
        <div>
            <div>Tags</div>
            <Tags />

            <div>Suugested Accounts</div>
            <Accounts />
        </div>
    )
}

export default SelfView