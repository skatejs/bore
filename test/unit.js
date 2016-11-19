/* @jsx h */

require('jsdom-global')();

// Basic registry mock must go before things that might use it.
const customElements = window.customElements = {
  registry: {},
  define (name, Ctor) {
    this.registry[name] = Ctor;
  },
  get (name) {
    return this.registry[name];
  }
};

const tape = require('tape');

// eslint-disable-next-line no-unused-vars
const { h, mount } = require('../src');

tape('creating elements by local name', ({ equal, end }) => {
  equal(<input />.localName, 'input');
  equal(<test />.localName, 'test');
  equal(<custom-element />.localName, 'custom-element');
  end();
});

tape('creating elements by function', ({ equal, end }) => {
  const Fn = () => <div />
  equal(<Fn />.localName, 'div');
  end();
});

tape('setting attributes', ({ equal, end }) => {
  const div = <div
    aria-test="aria something"
    data-test="data something"
    test1="test something"
    test2={1}
  />;
  equal(div.getAttribute('aria-test'), 'aria something');
  equal(div.getAttribute('data-test'), 'data something');
  equal(div.hasAttribute('test1'), false);
  equal(div.hasAttribute('test2'), false);
  equal(div['aria-test'], undefined);
  equal(div['data-test'], undefined);
  equal(div.test1, 'test something');
  equal(div.test2, 1);
  end();
});

tape('mount: all(string)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.all('div').length, 0);
  equal(div.all('span').length, 2);
  equal(div.all('#test1').length, 1);
  equal(div.all('#test2').length, 1);
  equal(div.all('#test3').length, 0);
  end();
});

tape('mount: all(node)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.all(<div />).length, 0);
  equal(div.all(<span />).length, 0);
  equal(div.all(<span id="test1" />).length, 0);
  equal(div.all(<span id="test1">test1</span>).length, 1);
  equal(div.all(<span id="test2">test2</span>).length, 1);
  equal(div.all(<span id="test3">test3</span>).length, 0);
  end();
});

tape('mount: all(object)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.all({}).length, 0);
  equal(div.all({ localName: 'test1' }).length, 0);
  equal(div.all({ id: 'test1' }).length, 1);
  equal(div.all({ id: 'test2' }).length, 1);
  equal(div.all({ id: 'test3' }).length, 0);
  end();
});

tape('mount: all(function)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.all(n => n.localName === 'span').length, 2);
  end();
});



tape('mount: has', ({ equal, end }) => {
  equal(mount(<div><span /></div>).has(<span />), true);
  end();
});



tape('mount: one', ({ equal, end }) => {
  equal(mount(<div><span /></div>).one(<span />).node.localName, 'span');
  end();
});



function mockCustomElement (fn) {
  // We don't need a constructor, just something that is returned from get().
  customElements.define('x-test', true);
  return fn(<x-test><x-test><span /></x-test></x-test>);
}

tape('mount: should descend into custom elements', ({ equal, end }) => {
  const ce = mockCustomElement(mount);
  equal(ce.all('span').length, 1);
  equal(ce.all('span')[0].node.localName, 'span');
  end();
});
