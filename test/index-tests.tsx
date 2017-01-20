
import { h, mount } from 'bore';

declare var customElements: any;
declare var describe: any;
declare var it: any;
declare global {
    namespace JSX {
        interface Element extends HTMLElement { }
        interface IntrinsicElements {
            [elem: string]: any
        }
    }
}


class MyElement extends HTMLElement { };
class MyComponent extends HTMLElement { };
function doSomething() { }

{
    const wrapper = mount(<div><span /></div>);
    console.log(wrapper.one('span').node.localName);
    // "span"
}
{
    console.log((<div />).localName);
    // "div"
}
// https://github.com/treshugart/bore#mounthtmlornode
{
    mount(<div><span /></div>);
}

// https://github.com/treshugart/bore#wrapper-api
{
    const wrapper = mount(<div><span /></div>);

    // https://github.com/treshugart/bore#node
    {
        // div
        mount(<div />).node.localName;
    }

    // https://github.com/treshugart/bore#allquery
    {
        // https://github.com/treshugart/bore#element-constructors
        {
            mount(<div><span /></div>).all(HTMLSpanElement);

            customElements.define('my-element', MyElement);

            mount(<div><my-element /></div>).all(MyElement);
        }

        // https://github.com/treshugart/bore#custom-filtering-function
        {
            mount(<div><span /></div>).all(node => node.localName === 'span');
        }

        // https://github.com/treshugart/bore#diffing-node-trees
        {
            mount(<div><span /></div>).all(<span />);
            mount(<div><span>test</span></div>).all(<span />);
        }

        // https://github.com/treshugart/bore#using-an-object-as-criteria
        {
            mount(<div><span id="test" /></div>).all({ id: 'test' });
            mount(<div><span id="test" /></div>).all({ id: 'test', somethingElse: true });
        }

        // https://github.com/treshugart/bore#selector
        {
            mount(<div><span id="test" /></div>).all('#test');
        }

    }

    // https://github.com/treshugart/bore#onequery
    {
        mount(<div><span /></div>).one(<span />);
    }

    // https://github.com/treshugart/bore#hasquery
    {
        mount(<div><span /></div>).has(<span />);
    }

    // https://github.com/treshugart/bore#waitthen
    {
        mount(<MyComponent />).wait().then(doSomething);

        mount(<MyComponent />).wait(doSomething);
    }

    // waitFor(funcReturnBool[, options = { delay: 1 }])
    {
        mount(<MyElement />).waitFor(wrapper => wrapper.has(<div />));

        describe('my custom element', () => {
            it('should have an empty div', () => {
                return mount(<MyComponent />).waitFor(w => w.has(<div />));
            })
        });

    }
}



