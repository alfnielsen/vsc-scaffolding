'use strict'
import * as vsc from 'vsc-base'
import * as vscode from 'vscode'

export default class Scaffolding {
   /**
    * The main method that runs the create template output
    */
   async createTemplate(uri?: vscode.Uri) {
      if (!uri) {
         vsc.showErrorMessage(
            'vsc Scaffolding most be run by right-clicking a file or folder!'
         )
         return
      }
      const path = vsc.pathAsUnix(uri.fsPath)
      let dir = vsc.getDir(path)
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
            templates.push({
               name,
               name_lower: name.toLocaleLowerCase(),
               path: filePath
            })
         }
      })
      if (templates.length === 0) {
         vsc.showErrorMessage(
            `NOTE: vsc-scaffolding didn't find any template files. A template file name can be place anywhere in the project, but it must end with '.vsc-template.js'`
         )
         return
      }

      const templateName = await vsc.pick(templates.map(t => t.name))

      if (!templateName) {
         return
      }
      const templateName_lower = templateName.toLocaleLowerCase()
      const selectedTemplate = templates.find(
         t => t.name_lower === templateName_lower
      )
      if (!selectedTemplate) {
         vsc.showErrorMessage(
            `NOTE: vsc-scaffolding didn't find your template '${templateName}'. The template must be in a file called '${templateName}.vsc-template.js'`
         )
         return
      }
      //
      const templateFile = await vsc.getFileContent(selectedTemplate.path)
      const templateCompiledFunction = eval(templateFile)
      const template: vsc.vscTemplate = templateCompiledFunction()
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
         await vsc.scaffoldTemplate(dir, item, userInputs)
      })

      vscode.window.showInformationMessage('Template output was created.')
   }
}
