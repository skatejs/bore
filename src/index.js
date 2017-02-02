const { DocumentFragment, Node, Promise } = window;
const { slice } = [];

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

function getInstantiatedNodeWithinFixture (node, isRootNode) {
  const isStringNode = typeof node === 'string';

  // If the fixture has been removed from the document, re-insert it.
  if (!body.contains(fixture)) {
    body.appendChild(fixture);
  }

  if (isRootNode) {
    setFixtureContent(node, isStringNode);
  }

  return isStringNode
    ? fixture.firstElementChild
    : node;
}

function setFixtureContent (node, shouldSetChildrenViaString) {
  // If this is a new node, clean up the fixture.
  fixture.innerHTML = '';

  // Add the node to the fixture so it runs the connectedCallback().
  shouldSetChildrenViaString
    ? (fixture.innerHTML = node)
    : (fixture.appendChild(node));
}

class Wrapper {
  constructor (node, opts = {}) {
    const isRootNode = !node.parentNode;

    this.opts = opts;
    this.node = getInstantiatedNodeWithinFixture(node, isRootNode);

    if (isRootNode) {
      const customElementDefinition = customElements.get(this.node.localName);
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
