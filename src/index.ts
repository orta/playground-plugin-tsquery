import { tsquery } from "@phenomnomnominal/tsquery";
import { el, renderAST } from "./vendor/utils";
import type { editor } from "monaco-editor";
import  type { Node } from "typescript";

let astVersion = -1
let ast:Node = undefined

const customPlugin: import("./vendor/playground").PlaygroundPlugin = {
  id: "tsquery",
  displayName: "TSQuery",
  // data: {

  // },
  didMount: (sandbox, container) => {
    // @ts-ignore
    window.tsquery = tsquery;

    const p = (str: string) => el(str, "p", container);
    const h4 = (str: string) => el(str, "h4", container);

    h4("Using TSQuery");
    p(`Create a gist with an <code>index.md</code> using a set of <code>---</code>s to split between slides. You can find out more about the syntax <a href="https://github.com/orta/playground-slides">here</a>. If you want to demo the slides, click here to try <a href="#" onclick='document.getElementById("gist-input").value = "https://gist.github.com/orta/d7dbd4cdb8d1f99c52871fb15db620bc"'>an existing deck</a>.`);

    const gistForm = createGistInputForm(sandbox);
    container.appendChild(gistForm);

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
  if (!results) return;
  while (results.firstChild) {
    results.removeChild(results.firstChild);
  }
  
  if (model.getVersionId() !== astVersion) {
    ast = await sandbox.getAST();
    astVersion = model.getVersionId()
  }

  const queryResults = tsquery(ast, query);
  
  console.log(queryResults);
  queryResults.forEach(node => {
    // @ts-ignore
    renderAST(results, node);
  });
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

export default customPlugin;
