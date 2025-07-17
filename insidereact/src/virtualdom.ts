//for structuring the DOM element 
export interface VNode {
    type: string;
    props: Record<string, any>;
    children: (VNode | string)[];
}

export const createElement = (
    type: string,
    props: Record<string, any> = {},
    ...children: (VNode | string)[]
): VNode => {
    return {
        type,
        props,
        children
    };
}

export const render = (vdom: VNode | string, container: HTMLElement): void => {
    if (typeof vdom === 'string' || typeof vdom === 'number') {
        const textNode = document.createTextNode(String(vdom));
        container.appendChild(textNode);
        return;
    }
    
    const domelement = document.createElement(vdom.type);
    
    // Update props
    updateProps(domelement, vdom.props);
    
    vdom.children.forEach(child => {
        render(child, domelement);
    });
    
    container.appendChild(domelement);
};

export const createDom = (vdom: VNode | string): Node => {
    if (typeof vdom === 'string' || typeof vdom === 'number') {
        return document.createTextNode(String(vdom));
    }
    
    const dom = document.createElement(vdom.type);
    
    // Update props
    updateProps(dom, vdom.props);
    
    vdom.children.forEach(child => {
        dom.appendChild(createDom(child));
    });
    
    return dom;
}

// Props update function
export const updateProps = (
    dom: HTMLElement,
    newProps: Record<string, any> = {},
    oldProps: Record<string, any> = {}
): void => {
    // Remove old props that are not in new props
    Object.keys(oldProps).forEach(key => {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                const eventName = key.substring(2).toLowerCase();
                if (typeof oldProps[key] === 'function') {
                    dom.removeEventListener(eventName, oldProps[key]);
                }
            } else if (key === 'children') {
                // Ignore children in props
            } else if (key === 'style') {
                dom.style.cssText = '';
            } else if (key === 'className') {
                dom.removeAttribute('class');
            } else if (typeof (dom as any)[key] === 'boolean') {
                (dom as any)[key] = false;
                dom.removeAttribute(key);
            } else {
                dom.removeAttribute(key);
            }
        }
    });

    // Add/update new props
    Object.keys(newProps).forEach(key => {
        if (newProps[key] !== oldProps[key]) {
            if (key.startsWith('on')) {
                const eventName = key.substring(2).toLowerCase();
                
                // Remove old event listener if it exists
                if (typeof oldProps[key] === 'function') {
                    dom.removeEventListener(eventName, oldProps[key]);
                }
                
                // Add new event listener
                if (typeof newProps[key] === 'function') {
                    dom.addEventListener(eventName, newProps[key]);
                } else if (newProps[key] !== null) {
                    console.warn(`Invalid event handler for ${eventName}`, newProps[key]);
                }
            } else if (key === 'children') {
                // Ignore children in props
            } else if (key === 'style' && typeof newProps.style === 'object') {
                const style = newProps.style;
                dom.style.cssText = ''; // Clear existing inline styles first
                Object.keys(style).forEach(styleName => {
                    (dom.style as any)[styleName] = style[styleName];
                });
            } else if (key === 'className') {
                dom.setAttribute('class', newProps[key]);
            } else if (typeof (dom as any)[key] === 'boolean') {
                const value = Boolean(newProps[key]);
                (dom as any)[key] = value;
                if (value) {
                    dom.setAttribute(key, '');
                } else {
                    dom.removeAttribute(key);
                }
            } else if (key === 'value' && (dom instanceof HTMLInputElement || dom instanceof HTMLTextAreaElement || dom instanceof HTMLSelectElement)) {
                if ((dom as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value !== newProps[key]) {
                    (dom as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value = newProps[key];
                }
                dom.setAttribute(key, String(newProps[key]));
            } else {
                dom.setAttribute(key, String(newProps[key]));
            }
        }
    });
};