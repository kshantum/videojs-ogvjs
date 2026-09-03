/**
 * Minimal stand-in for the 'ogv' package. The real OGVPlayer boots a WASM
 * decoder/worker that isn't available in Jest, so this returns a plain
 * element with the HTMLMediaElement-ish own properties src/plugin.js reads
 * via `hasOwnProperty` checks.
 */

class OGVPlayer {

    constructor() {
        const el = document.createElement('div');

        Object.assign(el, {
            play: jest.fn(),
            pause: jest.fn(),
            load: jest.fn(),
            src: '',
            currentTime: 0,
            duration: 0,
            paused: true,
            ended: false,
            seeking: false,
            seekable: [],
            buffered: [],
            networkState: 0,
            readyState: 0,
            error: null,
            autoplay: false,
            loop: false,
            poster: '',
            preload: 'none',
            playbackRate: 1,
            played: [],
            volume: 1,
            muted: false,
            defaultMuted: false,
            videoWidth: 0,
            videoHeight: 0
        });

        return el;
    }

}

const OGVLoader = {base: null};

const OGVCompat = {
    supported: jest.fn(() => true)
};

const ogv = {OGVPlayer, OGVLoader, OGVCompat};

export default ogv;
export {OGVPlayer, OGVLoader, OGVCompat};
