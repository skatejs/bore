const { DocumentFragment, Node, Promise } = window;
const { slice } = [];

function isAttribute (key) {
  return key === 'attrs';
}
function isEvent (key) {
  return key === 'events';
}

function handleFunction (Fn) {
  return Fn.prototype instanceof HTMLElement ? new Fn() : Fn();
}

function setAttrs (node, attrValue) {
  Object.keys(attrValue)
      .forEach((key) => { node.setAttribute(key, attrValue[key]); });
}
function setEvents (node, attrValue) {
  Object.keys(attrValue)
      .forEach((key) => { node.addEventListener(key, attrValue[key]); });
}
function setProps (node, attrName, attrValue) {
  node[attrName] = attrValue;
}

function setupNodeAttrs (node, attrs) {
  Object.keys(attrs || {})
    .forEach(attrName => {
      const attrValue = attrs[attrName];

      if (isAttribute(attrName)) {
        setAttrs(node, attrValue);
        return;
      }

      if (isEvent(attrName)) {
        setEvents(node, attrValue);
        return;
      }

      setProps(node, attrName, attrValue);
    });
}

function setupNodeChildren (node, children) {
  children.forEach(child => node.appendChild(child instanceof Node ? child : document.createTextNode(child)));
}

export function h (name, attrs, ...chren) {
  const node = typeof name === 'function' ? handleFunction(name) : document.createElement(name);
  setupNodeAttrs(node, attrs);
  setupNodeChildren(node, chren);
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

    const customElementDefinition = customElements.get(this.node.localName);
    const isRootNode = !node.parentNode;

    // If this is a new node, clean up the fixture.
    if (isRootNode) {
      fixture.innerHTML = '';
      customElementDefinition && flush();
    }

    // If the fixture has been removed from the document, re-insert it.
    if (!body.contains(fixture)) {
      body.appendChild(fixture);
    }

    // Add the node to the fixture so it runs the connectedCallback().
    if (isRootNode) {
      fixture.appendChild(node);
      customElementDefinition && flush();
    }
  }

  get shadowRoot () {
    const { node } = this;
    return node.shadowRoot || node;
  }

  all (query) {
    const { shadowRoot } = this;
    let temp = [];

    // Custom element constructors
    if (query.prototype instanceof HTMLElement) {
      this.walk(
        shadowRoot,
        node => node instanceof query,
        node => temp.push(node)
      );
    // Custom filtering function
    } else if (typeof query === 'function') {
      this.walk(
        shadowRoot,
        query,
        node => temp.push(node)
      );
    // Diffing node trees
    //
    // We have to check if the node type is an element rather than checking
    // instanceof because the ShadyDOM polyfill seems to fail the prototype
    // chain lookup.
    } else if (query.nodeType === Node.ELEMENT_NODE) {
      this.walk(
        shadowRoot,
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
        shadowRoot,
        node => keys.every(key => node[key] === query[key]),
        node => temp.push(node)
      );
    // Selector
    } else if (typeof query === 'string') {
      this.walk(
        shadowRoot,
        node => matches(node, query),
        node => temp.push(node),
        { skip: true }
      );
    }

    return temp.map(n => new Wrapper(n, this.opts));
  }

  has (query) {
    return !!this.one(query);
  }

  one (query) {
    return this.all(query)[0];
  }

  wait (func) {
    return this.waitFor(wrap => !!wrap.node.shadowRoot).then(func);
  }

  waitFor (func, { delay } = { delay: 1 }) {
    return new Promise((resolve, reject) => {
      const check = () => {
        const ret = (() => {
          try {
            return func(this);
          } catch (e) {
            reject(e);
          }
        })();
        if (ret) {
          resolve(this);
        } else {
          setTimeout(check, delay);
        }
      };
      setTimeout(check, delay);
    }).catch(e => {
      throw e;
    });
  }

  walk (node, query, callback, opts = { root: false, skip: false }) {
    // The ShadyDOM polyfill creates a shadow root that is a <div /> but is an
    // instanceof a DocumentFragment. For some reason a tree walker can't
    // traverse it, so we must traverse each child. Due to this implementation
    // detail, we must also tell the walker to include the root node, which it
    // doesn't do with the default implementation.
    if (node instanceof DocumentFragment) {
      slice.call(node.children).forEach(child => {
        this.walk(child, query, callback, {
          root: true,
          skip: opts.skip
        });
      });
      return;
    }

    const acceptNode = node =>
      query(node)
        ? NodeFilter.FILTER_ACCEPT
        : opts.skip ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_REJECT;

    // IE requires a function, standards compliant browsers require an object.
    acceptNode.acceptNode = acceptNode;

    // Last argument here is for IE.
    const tree = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, acceptNode, true);

    // Include the main node.
    if (opts.root && query(node)) {
      callback(node);
    }

    // Call user callback for each node.
    while (tree.nextNode()) {
      callback(tree.currentNode);
    }
  }
}

export function mount (elem) {
  return new Wrapper(elem);
}
