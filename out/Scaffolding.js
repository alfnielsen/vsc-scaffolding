'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const vscode = require("vscode");
class Scaffolding {
    /**
     * Return a list of all project template files.
     * (async return a list of all files in current project that ends with .vsc-tempate.js)
     */
    getTemplateFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield vscode.workspace.findFiles('**/*.vsc-template.js', '**/node_modules/**', 100000);
            return files;
        });
    }
    /**
     * Is the item a directory
     * @param path string
     */
    isDir(path) {
        return fs.statSync(path).isDirectory();
    }
    /**
     * Does the folder/file exist
     * @param path string
     */
    doesExists(path) {
        return fs.existsSync(path);
    }
    /**
     * Get the path to the current active file in vscode
     */
    getCurrentPath() {
        const activeEditor = vscode.window.activeTextEditor;
        const document = activeEditor && activeEditor.document;
        return (document && document.fileName) || '';
    }
    /**
     * Get the folder path from a file path
     * @param _path string
     */
    getDirFromPath(_path) {
        return path.dirname(_path);
    }
    /**
     * Recurvice function that goes through a template tree
     * @param path Full path to where the TemplateItem (file/folder) should be created
     * @param userInputs An object with user inputs {[key: string]: string}
     * @param item An TemplateItem (folde/file)
     */
    handleTempItem(path, userInputs, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (item.type === 'folder') {
                let name = item.name;
                if (typeof name === 'function') {
                    name = name.call(null, userInputs);
                }
                const folderPath = path + '/' + name;
                yield fs.mkdir(folderPath);
                if (item.children) {
                    item.children.forEach((childItem) => __awaiter(this, void 0, void 0, function* () {
                        this.handleTempItem(folderPath, userInputs, childItem);
                    }));
                }
                return;
            }
            if (item.type === 'file') {
                let name = item.name;
                if (typeof name === 'function') {
                    name = name.call(null, userInputs);
                }
                const filePath = path + '/' + name;
                let content = item.content;
                if (typeof content === 'function') {
                    content = content.call(null, userInputs);
                }
                yield fs.writeFile(filePath, content);
            }
        });
    }
    /**
     * The main method that runs the create template output
     * @todo Code split!!! :-P
     */
    createTemplate(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentPath = this.getCurrentPath();
            const currenDir = this.getDirFromPath(currentPath);
            let newPath;
            if (uri) {
                // From context menu in vsc
                newPath = this.getDirFromPath(uri.fsPath);
            }
            else {
                // User Propmt
                const promtNewPath = yield vscode.window.showInputBox({
                    prompt: 'Directory for the template output:',
                    value: currenDir
                });
                if (!promtNewPath) {
                    return;
                }
                newPath = promtNewPath;
            }
            const isDir = this.isDir(newPath);
            if (!isDir) {
                vscode.window.showErrorMessage('Template output can only be create in existing folder!');
                return;
            }
            /**
             * Collect all project templates:
             * This scans all files for .vsc-template.js to make a list of templates
             * @todo Maybe move this code, so it do not scan all file every times it run
             */
            const templatefiles = yield this.getTemplateFiles();
            const templates = [];
            templatefiles.forEach(file => {
                const match = file.fsPath.match(/([\w\-]+)\.vsc\-template\.js$/);
                if (match) {
                    const name = match[1];
                    templates.push({ name, path: file.fsPath });
                }
            });
            if (templates.length === 0) {
                vscode.window.showErrorMessage(`NOTE: vsc-scaffolding didn't find any template files. A template file name can be place anywhere in the project, but it must end with '.vsc-template.js'`);
                return;
            }
            const templateName = yield vscode.window.showInputBox({
                prompt: 'What template will you use? (Name of template)',
                value: templates[0].name
            });
            if (!templateName) {
                return;
            }
            const selectedTemplate = templates.find(t => t.name === templateName);
            if (!selectedTemplate) {
                vscode.window.showErrorMessage(`NOTE: vsc-scaffolding didn't find your template '${templateName}'. The template must be in a file called '${templateName}.vsc-template.js'`);
                return;
            }
            //
            const templateFile = fs.readFileSync(selectedTemplate.path, 'utf8');
            const templateCompiledFunction = eval(templateFile);
            const template = templateCompiledFunction();
            //template: Template,
            const userInputs = {};
            // Get User Inputs (For some unknown reason .foreach dont work... So we use normal for loop)
            for (let i = 0; i < template.userInputs.length; i++) {
                const item = template.userInputs[i];
                const userResponse = yield vscode.window.showInputBox({ prompt: item.title, value: item.defaultValue });
                if (!userResponse) {
                    return;
                }
                userInputs[item.argumentName] = userResponse;
            }
            // await template.userInputs.forEach(async (item: UserInput) => { })
            // Recursive create files and folder
            template.template.forEach((item) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleTempItem(newPath, userInputs, item);
            }));
        });
    }
}
exports.default = Scaffolding;
//# sourceMappingURL=Scaffolding.js.map