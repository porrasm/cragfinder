import React from "react";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

export const Markdown: React.FC<{ file: string, additionalText?: () => Promise<string> }> = ({ file, additionalText }) => {
  const [markdown, setMarkdown] = React.useState<string | null>(null)

  React.useEffect(() => {

    const buildMarkdown = async () => {
      const response = await fetch(file)
      const text = await response.text()
      const additional = additionalText ? await additionalText() : ''
      return text + additional
    }

    buildMarkdown()
      .then(text => setMarkdown(text))
  }, [file])

  return <div className="markdown-container">
    <ReactMarkdown>{markdown || ''}</ReactMarkdown>
  </div>
}
