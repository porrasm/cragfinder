import React from "react";
import { Header, TABS, Tab } from "./Header";
import { Markdown } from "./Markdown";
import { ErrorBoundary } from "./ErrorBoundary";
import { CragFinderMapWrapper } from "./CragfinderMapWrapper";
import { getUserDataManager } from "./userData";

const App = () => {
  const [tab, setTab] = React.useState<Tab>(TABS[0])

  return (
    <ErrorBoundary>
      <div>
        <Header tab={tab} setTab={setTab} />
        <Tabs tab={tab} />
      </div>
    </ErrorBoundary>
  )
}

const Tabs: React.FC<{ tab: Tab }> = ({ tab }) => {
  switch (tab) {
    case 'map':
      return <CragFinderMapWrapper />
    case 'legend':
      return <Markdown file='legend.md' />
    case 'info':
      return <Markdown file='info.md' additionalText={userDataInfoText} />
  }
}

const userDataInfoText = async () => {
  const userDataManager = getUserDataManager()

  const userSession = await userDataManager.loadSession()
  const userSettings = await userDataManager.loadSettings()
  const userData = await userDataManager.loadUserData()

  const allData = {
    userSession,
    userSettings,
    userData
  }

  return `

  ## User Data
  
  Your user data is stored in your browser's local storage and not stored on the server. This means that if you clear your browser's local storage, your user data will be lost. If you want to save your user data, you can copu it to a file and import it later (data import not yet implemented). All your saved data is shown below:
  
  \`\`\`
  ${JSON.stringify(allData, null, 2)}
  \`\`\`
  `
}

export default App
