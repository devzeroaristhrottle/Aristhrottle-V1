import React from 'react'
import Accounts from './SearchAccounts'
import Tags from './SearchTags'

function TrendingView() {
    return (
        <div>
            <div>Global</div>
            <Tags showRank={true}/>

            <div>
                Regional
                {/*Dropdown to select regions */}
            </div>
            <Tags showRank={true}/>

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

export default TrendingView