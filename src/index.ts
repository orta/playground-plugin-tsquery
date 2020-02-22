import  { tsquery } from "@phenomnomnominal/tsquery"

const customPlugin: import('./vendor/playground').PlaygroundPlugin = {  
  id: 'tsquery',
  displayName: 'TSQuery',
  didMount: (sandbox, container) => {
    // @ts-ignore
    window.tsquery = tsquery

    console.log('Showing new plugin')

    const p = document.createElement('p')
    p.textContent = 'Playground plugin defaults'
    container.appendChild(p)

    const startButton = document.createElement('input')
    startButton.type = 'button'
    startButton.value = 'Change the code in the editor'
    container.appendChild(startButton)

    startButton.onclick = () => {
      sandbox.setText('You clicked the button!')
    }
  },

  modelChangedDebounce: async (sandbox, _model) => {
    const ast = await sandbox.getAST()
    console.log(tsquery(ast, "Identifier"))
  },

  didUnmount: () => {
    console.log('Removing plugin')
  },
}

export default customPlugin
