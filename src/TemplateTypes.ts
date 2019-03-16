export type UserInput = {
	title: string
	argumentName: string
	defaultValue: string
}
export type UserInputs = { [key: string]: string }
export type StringDelegate = string | ((inputs: UserInputs) => void)

export type TemplateFolder = {
	type: 'folder'
	name: StringDelegate
	children?: TemplateItem[]
}
export type TemplateFile = {
	type: 'file'
	name: StringDelegate
	content: StringDelegate
}

export type TemplateItem = TemplateFolder | TemplateFile

export type Template = {
	userInputs: UserInput[]
	template: TemplateItem[]
}
