(function Template() {
	const camelize = str => str.replace(/\W+(.)/g, (_match, chr) => chr.toUpperCase())
	return {
		userInputs: [
			{
				title: 'What is the Component Name',
				argumentName: 'name', // will become input in template
				defaultValue: 'test'
			}
		],
		template: [
			{
				type: 'folder',
				name: inputs => `${camelize(inputs.name)}Component`,
				children: [
					{
						type: 'file',
						name: inputs => `${camelize(inputs.name)}.js`,
						content: inputs => `import React from 'react'

const ${camelize(inputs.name)} = ({ value }) => (
	<div class='${camelize(inputs.name)}_root'>{value}</div>
)

export default ${camelize(inputs.name)}
`
					},
					{
						type: 'file',
						name: inputs => `${camelize(inputs.name)}.css`,
						content: inputs => `
.${camelize(inputs.name)}_root {
	display: block;
}
`
					}
				]
			}
		]
	}
})
