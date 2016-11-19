const { Node } = window;

function startsWith (key, val) {
  return key.indexOf(val) === 0;
}

function shouldBeAttr (key, val) {
  return startsWith(key, 'aria-') || startsWith(key, 'data-');
}

function handleFunction (Fn) {
  return Fn.prototype instanceof HTMLElement ? new Fn() : Fn();
}

export function h (name, attrs, ...chren) {
  const node = typeof name === 'function' ? handleFunction(name) : document.createElement(name);
  Object.keys(attrs || []).forEach(attr =>
    shouldBeAttr(attr, attrs[attr])
      ? node.setAttribute(attr, attrs[attr])
      : (node[attr] = attrs[attr]));
  chren.forEach(child => node.appendChild(child instanceof Node ? child : document.createTextNode(child)));
  return node;
}



const { customElements, HTMLElement, NodeFilter } = window;
const { body } = document;
const { attachShadow } = HTMLElement.prototype;
const { diff } = require('skatejs-dom-diff').default;

// Ensure we can force sync operations in the polyfill.
if (customElements) {
  customElements.enableFlush = true;
}

// Create and add a fixture to append nodes to.
const fixture = document.createElement('div');
document.body.appendChild(fixture);

// Override to force mode "open" so we can query against all shadow roots.
HTMLElement.prototype.attachShadow = function () {
  return attachShadow.call(this, { mode: 'open' });
};

// Ensures polyfill operations are run sync.
function flush () {
  if (customElements && typeof customElements.flush === 'function') {
    customElements.flush();
  }
}

// Abstraction for browsers not following the spec.
function matches (node, query) {
  return (node.matches || node.msMatchesSelector).call(node, query);
}

function nodeFromHtml (html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

class Wrapper {
  constructor (node, opts = {}) {
    this.node = typeof node === 'string' ? nodeFromHtml(node) : node;
    this.opts = opts;

    const isRootNode = !node.parentNode;

    // If this is a new node, clean up the fixture.
    if (isRootNode) {
      fixture.innerHTML = '';
      flush();
    }

    // If the fixture has been removed from the document, re-insert it.
    if (!body.contains(fixture)) {
      body.appendChild(fixture);
    }

    // Add the node to the fixture so it runs the connectedCallback().
    if (isRootNode) {
      fixture.appendChild(node);
      flush();
    }

    // If there's no shadow root, our queries run from the host.
    this.shadowRoot = node.shadowRoot || node;
  }

  find (query) {
    let temp = [];

    // Custom element constructors
    if (query.prototype instanceof HTMLElement) {
      this.walk(
        this.shadowRoot,
        node => node instanceof query,
        node => temp.push(node)
      );
    // Custom filtering function
    } else if (typeof query === 'function') {
      this.walk(
        this.shadowRoot,
        query,
        node => temp.push(node)
      );
    // Diffing node trees
    } else if (query instanceof HTMLElement) {
      this.walk(
        this.shadowRoot,
        node => diff({ destination: query, source: node, root: true }).length === 0,
        node => temp.push(node)
      );
    // Using an object as criteria
    } else if (typeof query === 'object') {
      const keys = Object.keys(query);
      if (keys.length === 0) {
        return temp;
      }
      this.walk(
        this.shadowRoot,
        node => keys.every(key => node[key] === query[key]),
        node => temp.push(node)
      );
    // Selector
    } else if (typeof query === 'string') {
      this.walk(
        this.shadowRoot,
        node => matches(node, query),
        node => temp.push(node),
        { skip: true }
      );
    }

    return temp.map(n => new Wrapper(n, this.opts));
  }

  walk (node, query, callback, opts = { skip: false }) {
    const acceptNode = node =>
      query(node)
        ? NodeFilter.FILTER_ACCEPT
        : opts.skip ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_REJECT;

    // IE requires a function, standards compliant browsers require an object.
    acceptNode.acceptNode = acceptNode;

    // Last argument here is for IE.
    const tree = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, acceptNode, true);

    // Call user callback for each node.
    while (tree.nextNode()) {
      callback(tree.currentNode);
    }
  }
}

export function mount (elem) {
  return new Wrapper(elem);
}
