import React from "react"

export type Tab = 'map' | 'legend' | 'info'
export const TABS: Tab[] = ['map', 'legend', 'info']

type HeaderProps = {
  tab: Tab
  setTab: (tab: Tab) => void
}

export const Header: React.FC<HeaderProps> = ({ tab, setTab }) => {

  return <div className="header">
    <div className="tabs">
      {TABS.map(t => <div className={`tab ${tab === t ? 'active' : ''}`} key={t} onClick={() => setTab(t)}>
        <span className="tab-title">
          {t.substring(0, 1).toUpperCase() + t.substring(1)}
        </span>
      </div>)}
    </div>
  </div >
}
