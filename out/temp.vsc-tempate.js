"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const camelize = (str) => str.replace(/\W+(.)/g, (_match, chr) => chr.toUpperCase());
const scar = {
    userInputs: [
        {
            title: 'What is the Component Name',
            argumentName: 'name',
            defaultValue: 'test'
        }
    ],
    template: [
        {
            type: 'folder',
            name: (inputs) => `${camelize(inputs.name)}Component`,
            children: [
                {
                    type: 'file',
                    name: (inputs) => `${camelize(inputs.name)}.js`,
                    content: (inputs) => `import React from 'react'

const ${camelize(inputs.name)} = (props) => (
	<div>{props.value}</div>
)

export default ${camelize(inputs.name)}
`
                }
            ]
        }
    ]
};
exports.default = scar;
//# sourceMappingURL=temp.vsc-tempate.js.map