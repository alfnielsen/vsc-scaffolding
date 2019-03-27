'use strict'
import vsc from 'vsc-base'
import * as vscode from 'vscode'

import { Template } from './TemplateTypes'

export default class Scaffolding {
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
         await vsc.makeDir(folderPath)
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
         await vsc.saveFileContent(filePath, content)
      }
   }
   /**
    * The main method that runs the create template output
    * @todo Code split!!! :-P
    */
   async createTemplate(uri?: vscode.Uri) {
      if (!uri) {
         vsc.showErrorMessage('vsc Scaffolding most be run by right-clicking a file or folder!')
         return
      }
      const path = vsc.pathAsUnix(uri.fsPath)
      let [dir] = vsc.splitPath(path)
      const isDir = vsc.isDir(path)
      if (isDir) {
         dir = path
      }

      /**
       * Collect all project templates:
       * This scans all files for .vsc-template.js to make a list of templates
       * @todo Maybe move this code, so it do not scan all file every times it run
       */
      const templatefiles = await vsc.findFilePaths('**/*.vsc-template.js')
      const templates: { name: string; name_lower: string; path: string }[] = []
      templatefiles.forEach(filePath => {
         const match = filePath.match(/([\w\-]+)\.vsc\-template\.js$/)
         if (match) {
            const name = match[1]
            templates.push({ name, name_lower: name.toLocaleLowerCase(), path: filePath })
         }
      })
      if (templates.length === 0) {
         vsc.showErrorMessage(
            `NOTE: vsc-scaffolding didn't find any template files. A template file name can be place anywhere in the project, but it must end with '.vsc-template.js'`
         )
         return
      }

      const templateName = await vsc.ask('What template will you use? (Name of template)', templates[0].name)
      if (!templateName) {
         return
      }
      const templateName_lower = templateName.toLocaleLowerCase()
      const selectedTemplate = templates.find(t => t.name_lower === templateName_lower)
      if (!selectedTemplate) {
         vsc.showErrorMessage(
            `NOTE: vsc-scaffolding didn't find your template '${templateName}'. The template must be in a file called '${templateName}.vsc-template.js'`
         )
         return
      }
      //
      const templateFile = await vsc.getFileContent(selectedTemplate.path)
      const templateCompiledFunction = eval(templateFile)
      const template: Template = templateCompiledFunction()
      //template: Template,

      const userInputs: { [key: string]: string } = {}

      // Get User Inputs (For some unknown reason .foreach dont work... So we use normal for loop)
      for (let i = 0; i < template.userInputs.length; i++) {
         const item = template.userInputs[i]
         const userResponse = await vsc.ask(item.title, item.defaultValue)
         if (!userResponse) {
            return
         }
         userInputs[item.argumentName] = userResponse
      }
      // await template.userInputs.forEach(async (item: UserInput) => { })

      // Recursive create files and folder
      await template.template.forEach(async item => {
         await this.handleTempItem(path, userInputs, item)
      })

      vscode.window.showInformationMessage('Template output was created.')
   }
}
