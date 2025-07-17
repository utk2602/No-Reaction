export const createElement = (type, props = {}, ...children) => {
    return {
        type,
        props,
        children
    };
};
export const render = (vdom, container) => {
    if (typeof vdom === 'string' || typeof vdom === 'number') {
        const textNode = document.createTextNode(String(vdom));
        container.appendChild(textNode);
        return;
    }
    const domelement = document.createElement(vdom.type);
    //updating krna hoga props ko
    vdom.children.forEach(child => {
        render(child, domelement);
    });
    //props ko set karna hoga
    container.appendChild(domelement);
};
export const createDom = (vdom) => {
    if (typeof vdom === 'string' || typeof vdom === 'number') {
        return document.createTextNode(String(vdom));
    }
    const dom = document.createElement(vdom.type);
    //yaha bhi update karna hoga props ko
    vdom.children.forEach(child => {
        dom.appendChild(createDom(child));
    });
    return dom;
};
//yaha se props update krunga 
export const updateProps = (dom, newProps = {}, oldProps = {}) => {
    //yahan se older props ko remove karna hoga
    Object.keys(oldProps).forEach(key => {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                const eventName = key.substring(2).toLowerCase();
                if (typeof oldProps[key] === 'function') {
                    dom.removeEventListener(eventName, oldProps[key]);
                }
            }
            else if (key === 'children') {
                //isko ignore krna hoga not sure 
            }
            else if (key === 'style') {
                dom.style.cssText = '';
            }
            else if (key === 'className') {
                dom.removeAttribute('class');
            }
            else if (typeof dom[key] === 'boolean') {
                dom[key] = false;
                dom.removeAttribute(key);
            }
            else {
                dom.removeAttribute(key);
            }
        }
    });
};
