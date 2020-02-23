import type { Node } from "typescript"

/** Get a relative URL for something in your dist folder depending on if you're in dev mode or not */
export const requireURL = (path: string) => {
  // https://unpkg.com/browse/typescript-playground-presentation-mode@0.0.1/dist/x.js => unpkg/browse/typescript-playground-presentation-mode@0.0.1/dist/x
  const isDev = document.location.host.includes("localhost");
  const prefix = isDev ? "local/" : "unpkg/typescript-playground-presentation-mode/dist/";
  return prefix + path;
};

/** Use this to make a few dumb element generation funcs */
export const el = (str: string, el: string, container: Element) => {
  const para = document.createElement(el);
  para.innerHTML = str;
  container.appendChild(para);
};

/** Renderers a TypeScript AST */
export const renderAST = (parent: HTMLElement, node: Node) => {
  const renderItem = (parentElement: Element, node: Node) => {
    const ul =  document.createElement("ul")
    ul.className = "ast-tree"

    const li = document.createElement("li")
    ul.appendChild(li)
    
    const a = document.createElement("a")
    a.textContent = String(node.kind)
    li.appendChild(a)

    const kids = node.getChildren()
    if (kids.length) {
      const childUl =  document.createElement("ul")
      childUl.className = "ast-tree"
      li.appendChild(childUl)
  
      for (const child of kids) {
        renderItem(childUl, child)
      } 
  
      parentElement.appendChild(ul)
    }
  }

  renderItem(parent, node)


  const tree = document.querySelectorAll("ul.ast-tree a:not(:last-child)");
  for (var i = 0; i < tree.length; i++) {
    tree[i].addEventListener("click", function(e: MouseEvent) {

      // @ts-ignore
      const parent = e.target.parentElement;
      const classList = parent.classList;
      
      if (classList.contains("open")) {
        classList.remove("open");
        var opensubs = parent.querySelectorAll(":scope .open");

        for (var i = 0; i < opensubs.length; i++) {
          opensubs[i].classList.remove("open");
        }
      } else {
        classList.add("open");
      }
      e.preventDefault();
    });
  }
};
