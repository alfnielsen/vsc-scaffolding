# vsc-scaffolding README

The is an vscode extension. 

The project main goal is the create an easy way the create scaffolding templates.

## Usage

First add or create your templates, then:


1. Right-click folder/file
2. Select 'vsc Scaffolding'
3. Write the template name.
4. Optional: if the template has UserInputs, then fill them out.


![Use Extension](images/vsc-scaffolding.gif)


## Features

Create folders and files described in a single js template file. 

(The js file has a single function that returns a json template structure)

> You can create as many templates as you like! One file per template.

## Create Template

Create a file that ends with .vsc-template.js 
>{NAME}.vsc-template.js

The js template file must contain a single parentheses wrap method,
and it cannot use any extarnel js ref like import and require.

> I personally think is a good idea to create a .vsc-template folder in the root of your project and place all templates there.

**EX: Component.vsc-template.js**
```
(function Template(){
  const camelize = str => str.replace(/\W+(.)/g, (_match, chr) => chr.toUpperCase())
  return {
    userInputs: [
      {
        title: 'What is the Component Name',
        argumentName: 'name', // will become input in template
        defaultValue: 'test'
      }
    ],
    template: [{
      type: 'folder',
      name: inputs => `${camelize(inputs.name)}Component`,
      children: [{
        type: 'file',
        name: inputs => `${camelize(inputs.name)}.js`,
        content: inputs => `import React from 'react'

const ${camelize(inputs.name)} = ({ value }}) => (
  <div>{value}</div>
)

export default ${camelize(inputs.name)}
`
      }]
    }]
  }
})

```

# The template structure:

This is the actual typescript defined stucture

```
export type Template = {
  userInputs: UserInput[]
  template: TemplateItem[]
}

export type TemplateItem = TemplateFolder | TemplateFile

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

export type UserInput = {
  title: string
  argumentName: string
  defaultValue: string
}

export type UserInputs = { [key: string]: string }
export type StringDelegate = string | ((inputs: UserInputs) => void)

```

## Requirements

This extension internally use the following node_modules:  

> vscode
> fs-extra
> path


## Extension Settings

There are no setting in this version.

## Known Issues

No know issues

## Release Notes


### 0.0.3

Copy code from another test to create vsc extansions.
The code works as described.
