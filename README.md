# mole

*Work in progress.*

[Enzyme](https://github.com/airbnb/enzyme)-like testing utility built for the DOM and Web Components.



## Usage

Mole makes testing the DOM simpler in the same way Enzyme makes testing React simpler. It's built with Web Components in mind and follows similar conventions to Enzyme, but the APIs won't map 1:1.

```js
/* @jsx h */
import { h, mount }

const wrapper = mount(<div><span /></div>);
console.log(wrapper.one('span').node.localName);
// "span"
```



## Using with web components

Since web components are an extension of the HTML standard, Mole inherently works with it. However there are a few things that it does underneath the hood that should be noted.

1. The custom element polyfill is supported by calling `flush()` after mounting the nodes so things appear synchronous.
2. Nodes are mounted to a fixture that is always kept in the DOM (even if it's removed, it will put itself back). This is so that custom elements can go through their natural lifecycle.
3. The fixture is cleaned up on every mount, so there's no need to cleanup after your last mount.
4. The `attachShadow()` method is overridden to *always* provide an `open` shadow root so that there is always a `shadowRoot` property and it can be queried against. 





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

The mount function takes a node, or a string - and converts it to a node - and returns a wrapper around it. 

```js
import { mount, h } from 'mole';

mount(<div><span /></div>);
```


## Wrapper API

A wrapper is returned when you call `mount()`:

```js
const wrapper = mount(<div><span /></div>);
```

The wrapper contains several methods and properties that you can use to test your DOM.



### all(query)

You can search using pretty much anything and it will return an array of wrapped nodes that matched the query.



#### Element constructors

You can use element constructors to search for nodes in a tree.

```js
mount(<div><span /></div>).all(HTMLSpanElement);
```

Since custom elements are just extensions of HTML elements, you can do it in the sme exact way:

```js
class MyElement extends HTMLElement {};
customElements.define('my-element', MyElement);

mount(<div><my-element /></div>).all(MyElement);
```



#### Custom filtering function

Custom filtering functions are simply functions that take a single node argument.

```js
mount(<div><span /></div>).all(node => node.localName === 'span');
```



#### Diffing node trees

You can mount a node and search using a different node instance as long as it looks the same.

```js
mount(<div><span /></div>).all(<span />);
```

The node trees must match exactly, so this will not work.

```js
mount(<div><span>test</span></div>).all(<span />);
```



#### Using an object as criteria

You can pass an object and it will match the properties on the object to the properties on the element.

```js
mount(<div><span id="test" /></div>).all({ id: 'test' });
```

The objects must completely match, so this will not work.

```js
mount(<div><span id="test" /></div>).all({ id: 'test', somethingElse: true });
```


#### Selector

You can pass a string and it will try and use it as a selector.

```js
mount(<div><span id="test" /></div>).all('#test');
```



### one(query)

Same as `all(query)` but only returns a single wrapped node.

```js
mount(<div><span /></div>).one(<span />);
```



### has(query)

Same as `all(query)` but returns true or false if the query returned results.

```js
mount(<div><span /></div>).has(<span />);
```
