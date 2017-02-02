/* eslint-env jasmine, mocha */
/* @jsx h */

// We include these manually because ShadyCSS adds extra output which the tests
// arent't expecting. We also have to put the native-shim through babel because
// it's being pulled in from the node_modules directory which is excluded by
// default.
import 'babel?presets[]=es2015!skatejs-web-components/src/native-shim';
import '@webcomponents/custom-elements';
import '@webcomponents/shadydom';

// eslint-disable-next-line no-unused-vars
import { h, mount } from '../src';

const { customElements, DocumentFragment, HTMLElement, Promise, Event, CustomEvent } = window;

describe('bore', () => {
  it('creating elements by local name', () => {
    expect(<input />.localName).to.equal('input');
    expect(<test />.localName).to.equal('test');
    expect(<custom-element />.localName).to.equal('custom-element');
  });

  it('creating elements by function', () => {
    const Fn = () => <div />;
    expect(<Fn />.localName).to.equal('div');
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
    expect(div.hasAttribute('aria-test')).to.equal(false);
    expect(div.hasAttribute('data-test')).to.equal(false);
    expect(div.hasAttribute('test1')).to.equal(false);
    expect(div.hasAttribute('test2')).to.equal(false);

    expect(div.hasAttribute('aria-who')).to.equal(true);
    expect(div.hasAttribute('who')).to.equal(true);
    expect(div.hasAttribute('deck')).to.equal(true);
    expect(div.hasAttribute('rating')).to.equal(true);

    expect(div['aria-test']).to.equal('aria something');
    expect(div['data-test']).to.equal('data something');
    expect(div.test1).to.equal('test something');
    expect(div.test2).to.equal(1);

    expect(div['aria-who']).to.equal(undefined);
    expect(div.who).to.equal(undefined);
    expect(div.deck).to.equal(undefined);
    expect(div.rating).to.equal(undefined);
  });

  it('setting events', () => {
    const click = (e) => { e.target.clickTriggered = true; };
    const custom = (e) => { e.target.customTriggered = true; };

    const dom = <div events={{click, custom}} />;

    dom.dispatchEvent(new Event('click'));
    dom.dispatchEvent(new CustomEvent('custom'));

    expect(dom.onclick).to.equal(null);
    expect(dom.click).to.not.equal(undefined);
    expect(dom.getAttribute('click')).to.equal(null);
    expect(dom.clickTriggered).to.equal(true);

    expect(dom.custom).to.equal(undefined);
    expect(dom.getAttribute('custom')).to.equal(null);
    expect(dom.customTriggered).to.equal(true);
  });

  it('mount: all(string)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all('div').length).to.equal(0);
    expect(div.all('span').length).to.equal(2);
    expect(div.all('#test1').length).to.equal(1);
    expect(div.all('#test2').length).to.equal(1);
    expect(div.all('#test3').length).to.equal(0);
  });

  it('mount: all(node)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all(<div />).length).to.equal(0);
    expect(div.all(<span />).length).to.equal(0);
    expect(div.all(<span id='test1' />).length).to.equal(0);
    expect(div.all(<span id='test1'>test1</span>).length).to.equal(1);
    expect(div.all(<span id='test2'>test2</span>).length).to.equal(1);
    expect(div.all(<span id='test3'>test3</span>).length).to.equal(0);
  });

  it('mount: all(object)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all({}).length).to.equal(0);
    expect(div.all({ localName: 'test1' }).length).to.equal(0);
    expect(div.all({ id: 'test1' }).length).to.equal(1);
    expect(div.all({ id: 'test2' }).length).to.equal(1);
    expect(div.all({ id: 'test3' }).length).to.equal(0);
  });

  it('mount: all(function)', () => {
    const div = mount(
      <div>
        <span id='test1'>test1</span>
        <span id='test2'>test2</span>
      </div>
    );
    expect(div.all(n => n.localName === 'span').length).to.equal(2);
  });

  it('mount: has', () => {
    expect(mount(<div><span /></div>).has(<span />)).to.equal(true);
  });

  it('mount: one', () => {
    expect(mount(<div><span /></div>).one(<span />).node.localName).to.equal('span');
  });

  it('mount: should descend into custom elements', () => {
    class Test extends HTMLElement {
      connectedCallback () {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = '<span></span>';
      }
    }
    customElements.define('x-test-1', Test);
    const test = mount(<Test />);
    expect(test.all('span').length).to.equal(1);
    expect(test.all('span')[0].node.localName).to.equal('span');
  });

  it('mount: should descend for node as string into custom elements', () => {
    class Test extends HTMLElement {
      connectedCallback () {
        this.attachShadow();
        this.shadowRoot.innerHTML = '<span></span>';
      }
    }
    customElements.define('x-mount-test-2', Test);
    const test = mount('<x-mount-test-2></x-mount-test-2>');
    expect(test.all('span').length).to.equal(1);
    expect(test.all('span')[0].node.localName).to.equal('span');
  });
});

describe('then()', () => {
  it('should be a function', () => {
    expect(mount(<div />).wait).to.be.a('function');
  });

  it('should take no arguments', () => {
    expect(() => mount(<div />).wait()).to.not.throw();
  });

  it('should return a Promise', () => {
    expect(mount(<div />).wait()).to.be.an.instanceOf(Promise);
  });

  it('should wait for a shadowRoot', () => {
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
      expect(wrapperInPromise).to.equal(wrapper);
      expect(wrapperInPromise.node.shadowRoot).to.be.an.instanceOf(DocumentFragment);
    });
  });
});

describe('waitFor', () => {
  it('should be a function', () => {
    expect(mount(<div />).waitFor).to.be.a('function');
  });

  it('should return a Promise', () => {
    expect(mount(<div />).waitFor(() => {})).to.be.an.instanceOf(Promise);
  });

  it('should wait for a user-defined function to return true', () => {
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
      expect(wrapperInPromise).to.equal(wrapper);
      expect(wrapperInPromise.node.done).to.equal(true);
    });
  });
});
