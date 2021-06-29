

class Binding{

    constructor(getter,setter,registerFunction){
        this.getter = getter;
        this.setter = setter;
        this.registerFunction = registerFunction;
    }
}

class Bindings{

    changed(property,newValue){
        this._listeners = new Map();
    }

    addBinding( binding ){
        
    }

    set( property, value ){
        this[property] = value;
    }

    get( property ){
        return this[property];
    }

    addEventListener(property,listener){
        function getOrCreate(map,property){
        let set = map.get(property);
        if( !set ){
            set = new Set();
            map.put(property,set);
        }
        set.add(listener);
    }

    
}
