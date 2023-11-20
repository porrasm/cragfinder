import React from "react";
import classNames from "classnames";

type SelectOption = {
  label: string
  value: string
}
type Option = {
  label: string
  options?: readonly SelectOption[] | 'anyString' | 'boolean'
}

type Values = Record<string, boolean | string>

type OptionsProps<T extends Values> = {
  options: Record<keyof T, Option>
  values: T
  onChange: (values: T) => void
  showText?: string
  hideText?: string
  alwaysMobile?: boolean
  expandedDefault?: boolean
  onChangeExpanded?: (expanded: boolean) => void
  startElements?: React.ReactNode[]
}

type CheckboxElemOption = {
  key: string;
  value: string | boolean;
  label: string;
  options?: "boolean" | readonly SelectOption[] | "anyString" | undefined;
}

type DropdownElemOption = {
  key: string;
  label: string;
  options?: "boolean" | readonly SelectOption[] | "anyString" | undefined;
}

type TextInputElemOption = {
  key: string;
  label: string;
  options?: "boolean" | readonly SelectOption[] | "anyString" | undefined;
}



export function Options<T extends Values>({ options, values, onChange, showText, hideText, alwaysMobile, expandedDefault, onChangeExpanded, startElements }: OptionsProps<T>) {
  const [expanded, setExpanded] = React.useState(expandedDefault ?? false)

  const toggleExpanded = () => {
    setExpanded(prev => {
      onChangeExpanded?.(!prev)
      return !prev
    })
  }

  const onCheckboxChange = (key: string) => {
    onChange({ ...values, [key]: !values[key] })
  }

  const onDropdownChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value })
  }

  const onTextInputChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value })
  }

  const getChecbox = (toggle: CheckboxElemOption) => <label key={`toggle-${toggle.key}`}><input type="checkbox" checked={!!toggle.value} onChange={() => onCheckboxChange(toggle.key)} /> {toggle.label}</label>
  const getDropdown = (dropdown: DropdownElemOption) => <div key={`dropdown-${dropdown.key}`}>
    <label>{dropdown.label}</label>
    <select value={`${values[dropdown.key]}`} onChange={(e) => onDropdownChange(dropdown.key, e.target.value)}>
      {(dropdown.options as readonly SelectOption[]).map(option => (
        <option key={`dropdown-${dropdown.key}-${option.value}`} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
  const getTextInput = (textInput: TextInputElemOption) => <div key={`text-input-${textInput.key}`}>
    <label>{textInput.label}</label>
    {/* onChange is unoptimal */}
    <input className={classNames('option-text-input')} type="text" value={`${values[textInput.key]}`} onChange={(e) => onTextInputChange(textInput.key, e.target.value)} />
  </div>

  const optionsContent = () => <React.Fragment key='map-options-content'>
    {!!startElements?.length && startElements.map((element, index) => <React.Fragment key={`start-element-${index}`}>{element}</React.Fragment>)}
    {
      Object.keys(options).map(key => {
        const option = options[key]

        if (typeof option.options === "object") {
          return getDropdown({ ...option, key })
        } else if (option.options === 'anyString') {
          return getTextInput({ ...option, key })
        }

        return getChecbox({ ...option, key, value: values[key] })
      })
    }
  </React.Fragment>

  const desktopOptions = () => <div className={classNames('map-controls', 'hide-on-mobile')}>
    {optionsContent()}
  </div>

  const mobileOptions = () => <div className={classNames(expanded ? 'map-controls-expanded' : 'map-controls', !alwaysMobile && 'hide-on-desktop')}>
    <span className='mobile-options-header' onClick={toggleExpanded}>{expanded ? hideText : showText}</span>
    {expanded && optionsContent()}
  </div>


  return <React.Fragment key='map-options'>
    {mobileOptions()}
    {!alwaysMobile && desktopOptions()}
  </React.Fragment>
}
