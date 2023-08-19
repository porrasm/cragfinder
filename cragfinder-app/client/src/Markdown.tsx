import React from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

export const Markdown: React.FC<{ file: string }> = ({ file }) => {
  const [markdown, setMarkdown] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch(file)
      .then(response => response.text())
      .then(text => setMarkdown(text))
  }, [file])

  return <div className="markdown-container">
    <ReactMarkdown>{markdown || ''}</ReactMarkdown>
  </div>
}
