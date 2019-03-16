'use strict'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as vscode from 'vscode'

import { Template } from './TemplateTypes'

export default class Scaffolding {
	/**
	 * Return a list of all project template files.
	 * (async return a list of all files in current project that ends with .vsc-tempate.js)
	 */
	async getTemplateFiles() {
		const files = await vscode.workspace.findFiles('**/*.vsc-template.js', '**/node_modules/**', 100000)
		return files
	}
	/**
	 * Is the item a directory
	 * @param path string
	 */
	isDir(path: string) {
		return fs.statSync(path).isDirectory()
	}
	/**
	 * Does the folder/file exist
	 * @param path string
	 */
	doesExists(path: string): boolean {
		return fs.existsSync(path)
	}
	/**
	 * Get the path to the current active file in vscode
	 */
	getCurrentPath(): string {
		const activeEditor = vscode.window.activeTextEditor
		const document = activeEditor && activeEditor.document
		return (document && document.fileName) || ''
	}
	/**
	 * Get the folder path from a file path
	 * @param _path string
	 */
	getDirFromPath(_path: string) {
		return path.dirname(_path)
	}
	/**
	 * Recurvice function that goes through a template tree
	 * @param path Full path to where the TemplateItem (file/folder) should be created
	 * @param userInputs An object with user inputs {[key: string]: string}
	 * @param item An TemplateItem (folde/file)
	 */
	async handleTempItem(path: string, userInputs: any, item: any) {
		if (item.type === 'folder') {
			let name = item.name
			if (typeof name === 'function') {
				name = name.call(null, userInputs)
			}
			const folderPath = path + '/' + name
			await fs.mkdir(folderPath)
			if (item.children) {
				item.children.forEach(async (childItem: any) => {
					this.handleTempItem(folderPath, userInputs, childItem)
				})
			}
			return
		}
		if (item.type === 'file') {
			let name = item.name
			if (typeof name === 'function') {
				name = name.call(null, userInputs)
			}
			const filePath = path + '/' + name
			let content = item.content
			if (typeof content === 'function') {
				content = content.call(null, userInputs)
			}
			await fs.writeFile(filePath, content)
		}
	}
	/**
	 * The main method that runs the create template output
	 * @todo Code split!!! :-P
	 */
	async createTemplate(uri?: vscode.Uri) {
		const currentPath = this.getCurrentPath()
		const currenDir = this.getDirFromPath(currentPath)
		let newPath: string
		if (uri) {
			// From context menu in vsc
			newPath = this.getDirFromPath(uri.fsPath)
		} else {
			// User Propmt
			const promtNewPath = await vscode.window.showInputBox({
				prompt: 'Directory for the template output:',
				value: currenDir
			})
			if (!promtNewPath) {
				return
			}
			newPath = promtNewPath
		}

		const isDir = this.isDir(newPath)
		if (!isDir) {
			vscode.window.showErrorMessage('Template output can only be create in existing folder!')
			return
		}

		/**
		 * Collect all project templates:
		 * This scans all files for .vsc-template.js to make a list of templates
		 * @todo Maybe move this code, so it do not scan all file every times it run
		 */
		const templatefiles = await this.getTemplateFiles()
		const templates: { name: string; path: string }[] = []
		templatefiles.forEach(file => {
			const match = file.fsPath.match(/([\w\-]+)\.vsc\-template\.js$/)
			if (match) {
				const name = match[1]
				templates.push({ name, path: file.fsPath })
			}
		})
		if (templates.length === 0) {
			vscode.window.showErrorMessage(
				`NOTE: vsc-scaffolding didn't find any template files. A template file name can be place anywhere in the project, but it must end with '.vsc-template.js'`
			)
			return
		}

		const templateName = await vscode.window.showInputBox({
			prompt: 'What template will you use? (Name of template)',
			value: templates[0].name
		})
		if (!templateName) {
			return
		}
		const selectedTemplate = templates.find(t => t.name === templateName)
		if (!selectedTemplate) {
			vscode.window.showErrorMessage(
				`NOTE: vsc-scaffolding didn't find your template '${templateName}'. The template must be in a file called '${templateName}.vsc-template.js'`
			)
			return
		}
		//
		const templateFile = fs.readFileSync(selectedTemplate.path, 'utf8')
		const templateCompiledFunction = eval(templateFile)
		const template: Template = templateCompiledFunction()
		//template: Template,

		const userInputs: { [key: string]: string } = {}

		// Get User Inputs (For some unknown reason .foreach dont work... So we use normal for loop)
		for (let i = 0; i < template.userInputs.length; i++) {
			const item = template.userInputs[i]
			const userResponse = await vscode.window.showInputBox({ prompt: item.title, value: item.defaultValue })
			if (!userResponse) {
				return
			}
			userInputs[item.argumentName] = userResponse
		}
		// await template.userInputs.forEach(async (item: UserInput) => { })

		// Recursive create files and folder
		template.template.forEach(async item => {
			await this.handleTempItem(newPath, userInputs, item)
		})
	}
}
