import React from 'react'
import Tags from './SearchTags'
import Accounts from './SearchAccounts'

function PopularView() {
    return (
        <div>
            <div>Global</div>
            <Tags/>

            <div>
                Regional
                {/*Dropdown to select regions */}
            </div>
            <Tags/>

            <div>People Trending Worldwide</div>
            <Accounts />

            <div>
                People Trending Regionally
                 {/*Dropdown to select regions */}
            </div>
            <Accounts />
        </div>
    )
}

export default PopularView