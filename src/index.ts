import { tsquery } from "@phenomnomnominal/tsquery";
import type { editor } from "monaco-editor";
import type { Node } from "typescript";
import {PlaygroundPlugin, PluginUtils} from "./vendor/playground"
import { Sandbox } from "./vendor/sandbox";


let astVersion = -1
let ast:Node = undefined


const createUtils = (sandbox: Sandbox) => {

/** Use this to make a few dumb element generation funcs */
 const el = (str: string, el: string, container: Element) => {
  const para = document.createElement(el);
  para.innerHTML = str;
  container.appendChild(para);
};

  const createASTTree = (node: Node) => {
    const ts = sandbox.ts
    const div = document.createElement('div')
    div.className = "ast"


  // MIT licensed from ts-ast-viewer
  const getEnumFlagNames = (enumObj: any, flags: number) => {
    const allFlags = Object.keys(enumObj)
        .map(k => enumObj[k]).filter(v => typeof v === "number") as number[];

    const matchedFlags = allFlags.filter(f => (f & flags) !== 0);

    return matchedFlags
        .filter((f, i) => matchedFlags.indexOf(f) === i)
        .map(f => enumObj[f]);
  }
    

    const infoForNode = (node: Node) => {
      const whitelisted = ["pos"]
      const name = ts.SyntaxKind[node.kind]
      return {
        name,
      }
    }

    const renderLiteralField = (key: string, value: string) => {
      const li = document.createElement('li')
      li.innerHTML = `${key}: ${value}`
      return li
    }

    const renderSingleChild = (key: string, value: Node) => {
      const li = document.createElement('li')
      li.innerHTML = `${key}: <strong>${ts.SyntaxKind[value.kind]}</strong>`
      return li
    }

    const renderManyChildren = (key: string, value: Node[]) => {
      const li = document.createElement('li')
      const nodes = value.map(n => "<strong>&nbsp;&nbsp;" + ts.SyntaxKind[n.kind] + "<strong>").join("<br/>") 
      li.innerHTML = `${key}: [<br/>${nodes}</br>]`
      return li
    }
  
    const renderItem = (parentElement: Element, node: Node) => {
      const ul = document.createElement('ul')
      parentElement.appendChild(ul)
      ul.className = 'ast-tree'

      const info = infoForNode(node)
  
      const li = document.createElement('li')
      ul.appendChild(li)
  
      const a = document.createElement('a')
      a.textContent = info.name 
      li.appendChild(a)
  
      const properties = document.createElement('ul')
      properties.className = 'ast-tree'
      li.appendChild(properties)

      Object.keys(node).forEach(field => {
        if (typeof field === "function") return
        if (field === "parent" || field === "flowNode") return

        const value = node[field]
        if (typeof value === "object" && Array.isArray(value) && "pos" in value[0] && "end" in value[0]) {
          //  Is an array of Nodes
          properties.appendChild(renderManyChildren(field, value))
        } else if (typeof value === "object" && "pos" in value && "end" in value) {
          // Is a single child property
          properties.appendChild(renderSingleChild(field, value))
        } else {
          properties.appendChild(renderLiteralField(field, value))
        }
      })  
    }
  
    renderItem(div, node)
    return div
  }

  return {
    createASTTree,
    el
  }
}
let utils: PluginUtils


const pluginCreator = (utils: PluginUtils) => {

  const plugin: PlaygroundPlugin = {
    id: "tsquery",
    displayName: "TSQuery",
    // data: {
  
    // },
    didMount: (sandbox, container) => {
      utils = createUtils(sandbox) as any

      // @ts-ignore
      window.tsquery = tsquery;
  
      const p = (str: string) => utils.el(str, "p", container);
      const h4 = (str: string) => utils.el(str, "h4", container);
  
      h4("Using TSQuery");
      p(`Create a gist with an <code>index.md</code> using a set of <code>---</code>s to split between slides. You can find out more about the syntax <a href="https://github.com/orta/playground-slides">here</a>. If you want to demo the slides, click here to try <a href="#" onclick='document.getElementById("gist-input").value = "https://gist.github.com/orta/d7dbd4cdb8d1f99c52871fb15db620bc"'>an existing deck</a>.`);
  
      const gistForm = createGistInputForm(sandbox);
      container.appendChild(gistForm);
      
      const resultMeta = document.createElement("p")
      resultMeta.id = "query-results-meta"
      container.appendChild(resultMeta)
  
      const results = document.createElement("div");
      results.id = "query-results";
      container.appendChild(results);
  
      const model = sandbox.editor.getModel()
      runQuery(sandbox, model)
    },
  
    modelChangedDebounce: async (sandbox, model) => {
      runQuery(sandbox, model)
    },
  
    didUnmount: () => {
      console.log("Removing plugin");
    }
  };
  
  const runQuery = async (sandbox, model: editor.ITextModel) => {
    const query = localStorage.getItem("playground-tsquery-current-query");
    if (!query) return;
  
    console.log(query)
  
    // Cleanup
    const results = document.getElementById("query-results");
    const resultsMeta = document.getElementById("query-results-meta");
    resultsMeta.textContent = ""

    if (!results) return;
    while (results.firstChild) {
      results.removeChild(results.firstChild);
    }
    
    if (model.getVersionId() !== astVersion) {
      ast = await sandbox.getAST();
      astVersion = model.getVersionId()
    }
  
    let queryResults: Node[]

    try {
      queryResults = tsquery(ast, query);
    } catch (error) {
      console.log(error)
      resultsMeta.classList.add("err")
      resultsMeta.textContent = error.message
    }
    
    if (queryResults) {
      resultsMeta.classList.remove("err")

      const suffix = queryResults.length == 1 ? "result" : "results"
      resultsMeta.textContent = `Got ${queryResults.length} ${suffix}`

      queryResults.forEach(node => {
        const div = utils.createASTTree(node);
        results.append(div)
      });
    }
      
  }
  
  const createGistInputForm = (sandbox) => {
    const form = document.createElement("form");
  
    const gistHref = document.createElement("input");
    gistHref.id = "tsquery-input";
    gistHref.placeholder = `Identifier[name="Animal"]`;
    gistHref.autocomplete="off" 
    gistHref.autocapitalize="off" 
    gistHref.spellcheck=false
    // @ts-ignore
    gistHref.autocorrect="off" 
  
    const storedGistHref = localStorage.getItem("playground-tsquery-current-query");
    gistHref.value = storedGistHref;
  
    const updateState = ({ enable }) => {
      if (enable) {
        gistHref.classList.add("good");
        // startButton.disabled = false
      } else {
        gistHref.classList.remove("good");
        // startButton.disabled = true
      }
    };
  
    const textUpdate = e => {
      const href = e.target.value.trim();
      localStorage.setItem("playground-tsquery-current-query", href);
      
      console.log("text")
      const model = sandbox.editor.getModel()
      runQuery(sandbox, model)
  
      // updateState({ enable: isGist(href) })
    };
  
    
    gistHref.addEventListener("input", textUpdate)
  
    // gistHref.onkeyup = textUpdate;
    // gistHref.onpaste = textUpdate;
    // gistHref.onchange = textUpdate;
    // gistHref.onblur = textUpdate;
    // gistHref.oninput = textUpdate;
    form.appendChild(gistHref);
  
    updateState({ enable: gistHref.textContent && gistHref.textContent.length });
    return form;
  };

  return plugin
}


export default pluginCreator;
