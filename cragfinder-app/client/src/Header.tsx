import React from "react"

export const TABS = ['map', 'legend', 'info']
export type Tab = typeof TABS[number]

type HeaderProps = {
  tab: Tab
  setTab: (tab: Tab) => void
}

export const Header: React.FC<HeaderProps> = ({ tab, setTab }) => {

  return <div className="header">
    <div className="tabs">
      {TABS.map(t => <div className={`tab ${tab === t ? 'active' : ''}`} key={t} onClick={() => setTab(t)}>{t.substring(0, 1).toUpperCase() + t.substring(1)}</div>)}
    </div>
  </div>
}
