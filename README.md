# mole

*Work in progress.*

Enzyme-like testing for the DOM.



## Usage

Mole makes testing the DOM simpler in the same way Enzyme makes testing React simpler. It's built with Web Components in mind and follows similar conventions to Enzyme, but the APIs won't map 1:1.

```js
const wrapper = mount(<div><span>test</span></div>);
console.log(wrapper.find(<span>test</span>)[0].node.localName);
// span
```



## API

Since Shadow DOM hides implementation details, it negates having to provide a way to do shallow rendering. Therefore, we only need to provide a simple way to wrap a component.



### `h(name, attrsOrProps, ...children)`

Mole ships with a simple JSX to DOM function that you can use as your JSX pragma, if that's your sort of thing.

```js
/* @jsx h */
import { h } from 'mole';

console.log(<div />.localName);
// "div"
```

If you don't want to configure the pragma and you want to just leave it as React, you can do the following:

```js
import { h } from 'mole';

const React = { createElement: h };

console.log(<div />.localName);
// "div"
```

This can probably be confusing to some, so this is only recommended as a last resort.



#### Setting attributes vs properties

The `h` function prefers props unless it's something that *must* be set as an attribute, such as `aria-` or `data-`. As a best practice, your web component should be designed to prefer props and reflect to attributes only when it makes sense.



### `mount(htmlOrNode)`

The mount function takes a string and converts it to a node, or a node directly and returns a wrapper around 

```js
import { mount, h } from 'mole';

const MyElement extends HTMLElement {
  connectedCallbakc () {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '<span>test</span>';
  }
}

mount(<MyElement />).contains(<span>test</span>)).to.equal(true);
```


## Wrapper API

A wrapper is returned when you call `mount()`:

```js
const wrapper = mount(<MyElement />);
```



### find(query)

You can search using pretty much anything and it will return an array of wrapped nodes that matched the query.



#### Element constructors

You can use element constructors to search for nodes in a tree.

```js
mount(<div><span /></div>).find(HTMLSpanElement);
```

Since custom elements are just extensions of HTML elements, you can do it in the sme exact way:

```js
class MyElement extends HTMLElement {};
customElements.define('my-element', MyElement);

mount(<div><my-element /></div>).find(MyElement);
```



#### Custom filtering function

Custom filtering functions are simply functions that take a single node argument.

```js
mount(<div><span /></div>).find(node => node.localName === 'span');
```



#### Diffing node trees

You can mount a node and search using a different node instance as long as it looks the same.

```js
mount(<div><span /></div>).find(<span />);
```

The node trees must match exactly, so this will not work.

```js
mount(<div><span>test</span></div>).find(<span />);
```



#### Using an object as criteria

You can pass an object and it will match the properties on the object to the properties on the element.

```js
mount(<div><span id="test" /></div>).find({ id: 'test' });
```

The objects must completely match, so this will not work.

```js
mount(<div><span id="test" /></div>).find({ id: 'test', somethingElse: true });
```


#### Selector

You can pass a string and it will try and use it as a selector.

```js
mount(<div><span id="test" /></div>).find('#test');
```


