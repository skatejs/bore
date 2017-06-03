/** @jsx h */
/* eslint-env jest */

const { h, mount } = require('../src');
const { customElements, DocumentFragment, HTMLElement, Promise, Event, CustomEvent } = window;
const hasCustomElements = 'customElements' in window;
const hasQuerySelector = 'querySelector' in Element.prototype;

function empty (value) {
  expect(value == null).toEqual(true);
}

describe('bore', () => {
  it('creating elements by local name', () => {
    expect(<input />.nodeName).toEqual('INPUT');
    expect(<test />.nodeName).toEqual('TEST');
    expect(<custom-element />.nodeName).toEqual('CUSTOM-ELEMENT');
  });

  it('creating elements by function', () => {
    const Fn = () => <div />;
    expect(<Fn />.nodeName).toEqual('DIV');
  });

  it('setting attributes', () => {
    const div = <div
      aria-test='aria something'
      data-test='data something'
      test1='test something'
      test2={1}
      attrs={{
        'aria-who': 'Tony Hawk',
        who: 'Tony Hawk',
        deck: 'birdhouse',
        rating: 10
      }}
    />;
    expect(div.hasAttribute('aria-test')).toEqual(false);
    expect(div.hasAttribute('data-test')).toEqual(false);
    expect(div.hasAttribute('test1')).toEqual(false);
    expect(div.hasAttribute('test2')).toEqual(false);

    expect(div.hasAttribute('aria-who')).toEqual(true);
    expect(div.hasAttribute('who')).toEqual(true);
    expect(div.hasAttribute('deck')).toEqual(true);
    expect(div.hasAttribute('rating')).toEqual(true);

    expect(div['aria-test']).toEqual('aria something');
    expect(div['data-test']).toEqual('data something');
    expect(div.test1).toEqual('test something');
    expect(div.test2).toEqual(1);

    empty(div['aria-who']);
    empty(div.who);
    empty(div.deck);
    empty(div.rating);
  });

  it('setting events', () => {
    const click = (e) => { e.target.clickTriggered = true; };
    const custom = (e) => { e.target.customTriggered = true; };

    const dom = mount(<div events={{click, custom}} />).node;

    dom.dispatchEvent(new Event('click'));
    dom.dispatchEvent(new CustomEvent('custom'));

    expect(dom.clickTriggered).toEqual(true);
    expect(dom.customTriggered).toEqual(true);
  });

  // This isn't implemented in some server-side DOM environments.
  hasQuerySelector && it('mount: all(string)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all('div').length).toEqual(0);
    expect(div.all('span').length).toEqual(2);
    expect(div.all('#test1').length).toEqual(1);
    expect(div.all('#test2').length).toEqual(1);
    expect(div.all('#test3').length).toEqual(0);
  });

  it('mount: all(node)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all(<div />).length).toEqual(0);
    expect(div.all(<span />).length).toEqual(0);
    expect(div.all(<span id='test1' />).length).toEqual(0);
    expect(div.all(<span id='test1'>test1</span>).length).toEqual(1);
    expect(div.all(<span id='test2'>test2</span>).length).toEqual(1);
    expect(div.all(<span id='test3'>test3</span>).length).toEqual(0);
  });

  it('mount: all(object)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all({}).length).toEqual(0);
    expect(div.all({ nodeName: 'TEST1' }).length).toEqual(0);
    expect(div.all({ id: 'test1' }).length).toEqual(1);
    expect(div.all({ id: 'test2' }).length).toEqual(1);
    expect(div.all({ id: 'test3' }).length).toEqual(0);
  });

  it('mount: all(function)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all(n => n.nodeName === 'SPAN').length).toEqual(2);
  });

  it('mount: has', () => {
    expect(mount(<div><span /></div>).has(<span />)).toEqual(true);
  });

  it('mount: one', () => {
    expect(mount(<div><span /></div>).one(<span />).node.nodeName).toEqual('SPAN');
  });

  hasCustomElements && it('mount: should descend into custom elements', () => {
    class Test extends HTMLElement {
      connectedCallback () {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = '<span></span>';
      }
    }
    customElements.define('x-test-1', Test);
    const test = mount(<Test />);
    const coll = test.one({ nodeName: 'SPAN' });
    expect(coll.node.nodeName).toEqual('SPAN');
  });
});

describe('then()', () => {
  it('should be a function', () => {
    expect(typeof mount(<div />).wait).toEqual('function');
  });

  it('should take no arguments', () => {
    expect(() => mount(<div />).wait()).not.toThrow();
  });

  it('should return a Promise', () => {
    expect(mount(<div />).wait()).toBeInstanceOf(Promise);
  });

  hasCustomElements && it('should wait for a shadowRoot', () => {
    class MyElement extends HTMLElement {
      connectedCallback () {
        setTimeout(() => {
          this.attachShadow({ mode: 'open' });
        }, 100);
      }
    }
    customElements.define('x-test-2', MyElement);
    const wrapper = mount(<MyElement />);
    return wrapper.wait(wrapperInPromise => {
      expect(wrapperInPromise).toEqual(wrapper);
      expect(wrapperInPromise.node.shadowRoot).toBeInstanceOf(Node);
    });
  });
});

describe('waitFor', () => {
  it('should be a function', () => {
    expect(typeof mount(<div />).waitFor).toEqual('function');
  });

  it('should return a Promise', () => {
    expect(mount(<div />).waitFor(() => {})).toBeInstanceOf(Promise);
  });

  hasCustomElements && it('should wait for a user-defined function to return true', () => {
    class MyElement extends HTMLElement {
      connectedCallback () {
        setTimeout(() => {
          this.done = true;
        }, 100);
      }
    }
    customElements.define('x-test-3', MyElement);
    const wrapper = mount(<MyElement />);
    return wrapper.waitFor(wrap => wrap.node.done).then(wrapperInPromise => {
      expect(wrapperInPromise).toEqual(wrapper);
      expect(wrapperInPromise.node.done).toEqual(true);
    });
  });
});
