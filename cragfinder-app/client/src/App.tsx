import React from "react";
import { CragFinderMapWrapper } from "./CragfinderMap";
import { Header, TABS, Tab } from "./Header";
import { Markdown } from "./Markdown";

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
      return <CragFinderMapWrapper />
    case 'legend':
      return <Markdown file='legend.md' />
    case 'info':
      return <Markdown file='info.md' />
  }
}

export default App
