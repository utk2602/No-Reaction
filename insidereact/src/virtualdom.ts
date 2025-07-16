//for structuring the DOM elemenet 
export interface VNode {
    type:string;
    props:Record<string,any>;
    children:(VNode | string)[];
}

export const createElement=(
    type: string,
    props: Record<string, any >={},
    ...children: (VNode | string)[]
): VNode => {
    return {
        type,
        props,
        children
    };
}

export  const render=(vdom:VNode| string , container: HTMLElement): void => {
    if(typeof vdom==='string'|| typeof vdom==='number'){
        const textNode=document.createTextNode(String(vdom));
        container.appendChild(textNode);
        return;

    }
    const domelement=document.createElement(vdom.type);
    //updating krna hoga props ko
       
    vdom.children.forEach(child => {
        render(child, domelement);
    });
    //props ko set karna hoga
    container.appendChild(domelement);
};
