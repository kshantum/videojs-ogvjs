/**
 * Minimal stand-in for the 'video.js' package, just enough of the Tech/Component
 * surface for src/plugin.js to run against in Jest without loading the real
 * video.js UI framework.
 */

const browser = {
    IS_IPHONE: false,
    IS_IPAD: false,
    IS_ANDROID: false
};

class Tech {

    constructor(options = {}, ready = () => {}) {
        this.options_ = options;
        this.el_ = this.createEl();
        this.readyCallback_ = ready;
        this.listeners_ = {};
    }

    createEl() {
        return document.createElement('div');
    }

    on(event, callback) {
        (this.listeners_[event] = this.listeners_[event] || []).push(callback);
    }

    trigger(event) {
        (this.listeners_[event] || []).forEach((callback) => callback());
    }

    triggerReady() {
        this.readyCallback_();
    }

}

Tech.registerTech = jest.fn();

const components = {
    Tech
};

const videojs = {
    getComponent: (name) => components[name],
    browser,
    log: jest.fn()
};

export default videojs;
export {Tech, browser};
