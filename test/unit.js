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

tape('mount: find(string)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.find('div').length, 0);
  equal(div.find('span').length, 2);
  equal(div.find('#test1').length, 1);
  equal(div.find('#test2').length, 1);
  equal(div.find('#test3').length, 0);
  end();
});

tape('mount: find(node)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.find(<div />).length, 0);
  equal(div.find(<span />).length, 0);
  equal(div.find(<span id="test1" />).length, 0);
  equal(div.find(<span id="test1">test1</span>).length, 1);
  equal(div.find(<span id="test2">test2</span>).length, 1);
  equal(div.find(<span id="test3">test3</span>).length, 0);
  end();
});

tape('mount: find(object)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.find({}).length, 0);
  equal(div.find({ localName: 'test1' }).length, 0);
  equal(div.find({ id: 'test1' }).length, 1);
  equal(div.find({ id: 'test2' }).length, 1);
  equal(div.find({ id: 'test3' }).length, 0);
  end();
});

tape('mount: find(function)', ({ equal, end }) => {
  const div = mount(
    <div>
      <span id="test1">test1</span>
      <span id="test2">test2</span>
    </div>
  );
  equal(div.find(n => n.localName === 'span').length, 2);
  end();
});



function mockCustomElement (fn) {
  // We don't need a constructor, just something that is returned from get().
  customElements.define('x-test', true);
  return fn(<x-test><x-test><span /></x-test></x-test>);
}

tape('mount: should descend into custom elements', ({ equal, end }) => {
  const ce = mockCustomElement(mount);
  equal(ce.find('span').length, 1);
  equal(ce.find('span')[0].node.localName, 'span');
  end();
});
