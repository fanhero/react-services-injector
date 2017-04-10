class Injector {
    constructor() {
        this.key = -1;
        this.components = [];
        this.services = [];
    }

    createInstance(service) {
        let instance = new service();
        let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

        methods.forEach(method => {
            if (method === 'constructor' || method.indexOf('get') === 0)
        return;

        instance['__' + method] = instance[method];

        instance[method] = (...args) => {
            instance['__' + method].apply(instance, args);

            this.components.forEach(component => component.instance.forceUpdate());
        };
    });

        return instance;
    }

    get() {
        return this.services.reduce((obj, service) => Object.assign(obj, {
            [service.name]: service.instance
        }), {});
    }

    register(data) {
        if (Array.isArray(data)) {
            data.forEach(item => this.services.push({name: item.name, instance: this.createInstance(item.service)}))
        } else {
            this.services.push({name: data.name, instance: this.createInstance(data.service)});
        }
    }

    connectInstance(instance) {
        this.components.push({
            key: ++this.key,
            instance
        });

        return this.key;
    }

    disconnectInstance(id) {
        this.components = this.components.filter(item => item.key !== id);
    }

    connect(component) {
        let key = null;

        class ConnectedComponent extends component {
            constructor(props) {
                super(props);

                this.services = Object.assign({}, injector.get());
                key = injector.connectInstance(this);
            }

            componentWillUnmount() {
                injector.disconnectInstance(key);

                if (super.componentWillUnmount)
                    super.componentWillUnmount();
            }

            static get name() {
                return component.name;
            }
        }

        return ConnectedComponent;
    }
}

const injector = new Injector();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = injector;
    return;
} else {
    exports.injector = injector;
}