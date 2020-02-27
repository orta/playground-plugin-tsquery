import { tsquery } from "@phenomnomnominal/tsquery";
import type { editor } from "monaco-editor";
import type { Node } from "typescript";
import {PlaygroundPlugin, PluginUtils} from "./vendor/playground"

const pluginCreator = (utils: PluginUtils) => {

  let astVersion = -1
  let ast:Node = undefined

  const plugin: PlaygroundPlugin = {
    id: "tsquery",
    displayName: "TSQuery",

    didMount: (sandbox, container) => {
      // @ts-ignore - so people can use the console to do tsquery also
      window.tsquery = tsquery;
      console.log('New global:')
      // @ts-ignore
      console.log('\twindow.tsquery', window.tsquery)
  
      // Add some info saying how to use it
      const p = (str: string) => utils.el(str, "p", container);
      p(`Use the textbox below to make a query, queries happen as you type. You can query using any TypeScript <a href='https://github.com/microsoft/TypeScript/blob/master/src/compiler/types.ts#L123' target='_blank'>AST SyntaxKind</a> type`);
  
      // Inject a form with an input to the container
      const outerQueryForm = createQueryInputForm(sandbox);
      container.appendChild(outerQueryForm);
      
      // Create some elements to put the results in
      const resultMeta = document.createElement("p")
      resultMeta.id = "query-results-meta"
      container.appendChild(resultMeta)
  
      const results = document.createElement("div");
      results.id = "query-results";
      container.appendChild(results);
  
      // Because the query is stored between sessions, then you could
      // have something we can run on launch
      const model = sandbox.editor.getModel()
      runQuery(sandbox, model)
    },
  
    // When we get told about an update to the monaco model then update our query
    modelChangedDebounce: async (sandbox, model) => {
      runQuery(sandbox, model)
    },
  };
  
  /** Runs the input against the current AST */
  const runQuery = async (sandbox, model: editor.ITextModel) => {
    // Empty the results section
    const results = document.getElementById("query-results");
    const resultsMeta = document.getElementById("query-results-meta");
    resultsMeta.textContent = ""

    // Just being safe
    if (!results) return;
    while (results.firstChild) {
      results.removeChild(results.firstChild);
    }

    // NOOP when we don't need to do something
    const query = localStorage.getItem("playground-tsquery-current-query");
    if (!query) return;
    
    // If the model hasn't changed (getVersionId increments on text changes)
    // then we don't need to get a new copy of the AST to query against
    if (model.getVersionId() !== astVersion) {
      ast = await sandbox.getAST();
      astVersion = model.getVersionId()
    }
  
    // The API throws when the query is invalid, so 
    // use a try catch to give an error message
    let queryResults: Node[]

    try {
      queryResults = tsquery(ast, query);
    } catch (error) {
      console.log(error)
      resultsMeta.classList.add("err")
      resultsMeta.textContent = error.message
    }
    // Show resukts
    if (queryResults) {
      resultsMeta.classList.remove("err")

      const suffix = queryResults.length == 1 ? "result" : "results"
      resultsMeta.textContent = `Got ${queryResults.length} ${suffix}`

      queryResults.forEach(node => {
        // Use the utils version of `createASTTree` so that this plugin gets
        // free upgrades as it becomes good.
        const div = utils.createASTTree(node);
        results.append(div)
      });
    }    
  }
  
  /** Creates a form with a textbox which runs the query */
  const createQueryInputForm = (sandbox) => {
    const form = document.createElement("form")
  
    const textbox = document.createElement("input")
    textbox.id = "tsquery-input"
    textbox.placeholder = `Identifier[name="Animal"]`
    textbox.autocomplete ="off" 
    textbox.autocapitalize = "off" 
    textbox.spellcheck = false
    // @ts-ignore
    textbox.autocorrect = "off" 
  
    const storedQuery = localStorage.getItem("playground-tsquery-current-query")
    textbox.value = storedQuery
  
    const updateState = ({ enable }) => {
      if (enable) {
        textbox.classList.add("good")
      } else {
        textbox.classList.remove("good")
      }
    };
  
    const textUpdate = e => {
      const href = e.target.value.trim()
      localStorage.setItem("playground-tsquery-current-query", href)
      
      console.log("text")
      const model = sandbox.editor.getModel()
      runQuery(sandbox, model)
    };
  
    textbox.style.width = "90%"
    textbox.style.height = "2rem"
    textbox.addEventListener("input", textUpdate)

    // Suppress the enter key
    textbox.onkeydown = (evt: KeyboardEvent) => {
      if (evt.keyCode == 13) return false
    }

    form.appendChild(textbox)
    updateState({ enable: textbox.textContent && textbox.textContent.length })
    return form
  };

  return plugin
}

export default pluginCreator;
