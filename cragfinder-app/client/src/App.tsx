import React from "react";
import { CragfinderMap } from "./CragfinderMap";
import { Header, TABS, Tab } from "./Header";

const App = () => {
  const [tab, setTab] = React.useState<Tab>(TABS[0])

  return (
    <div>
      <Header tab={tab} setTab={setTab} />
      <Tabs tab={tab} />
    </div>
  )
}

const Tabs: React.FC<{ tab: Tab }> = ({ tab }) => {
  switch (tab) {
    case 'map':
      return <CragfinderMap />
    case 'legend':
      return <div>Legend</div>
    case 'info':
      return <div>Info</div>
  }
}

export default App
