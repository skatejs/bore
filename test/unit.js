/* eslint-env jasmine, mocha */
/* @jsx h */

// We include these manually because ShadyCSS adds extra output which the tests
// arent't expecting. We also have to put the native-shim through babel because
// it's being pulled in from the node_modules directory which is excluded by
// default.
import 'babel?presets[]=es2015!skatejs-web-components/src/native-shim';
import 'babel?presets[]=es2015!@webcomponents/custom-elements/src/custom-elements';
import '@webcomponents/shadydom';

// eslint-disable-next-line no-unused-vars
import { h, mount } from '../src';

const { customElements, HTMLElement } = window;

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
    />;
    expect(div.getAttribute('aria-test')).to.equal('aria something');
    expect(div.getAttribute('data-test')).to.equal('data something');
    expect(div.hasAttribute('test1')).to.equal(false);
    expect(div.hasAttribute('test2')).to.equal(false);
    expect(div['aria-test']).to.equal(undefined);
    expect(div['data-test']).to.equal(undefined);
    expect(div.test1).to.equal('test something');
    expect(div.test2).to.equal(1);
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
    customElements.define('x-test', Test);
    const test = mount(<Test />);
    expect(test.all('span').length).to.equal(1);
    expect(test.all('span')[0].node.localName).to.equal('span');
  });
});
