// UMD library
export as namespace bore;

// Public API
export function mount(htmlOrNode: JSX.Element | JSX.Element[] | string): WrappedNode;
export function h(name: string, attrsOrProps?: Object, ...children: any[]): JSX.Element | JSX.Element[];


interface WrappedNode extends Wrapper {
    node: BoreNode,
}

interface Wrapper {
    all<T extends HTMLElement>(query: Query<T>): WrappedNode[],
    one<T extends HTMLElement>(query: Query<T>): WrappedNode,
    has<T extends HTMLElement>(query: Query<T>): boolean,

    wait(callback?: (wrapper: WrappedNode) => any): Promise<WrappedNode>,
    waitFor(callback: (wrapper: WrappedNode) => boolean, options?: { delay?: number }): Promise<WrappedNode>,
}

type Query<T> = string | JSX.Element | T | ((node: BoreNode) => boolean) | Object;

interface BoreNode extends HTMLElement {}


