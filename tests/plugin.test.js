import {Tech, browser} from './mocks/videojs.mock.js';
import {OGVCompat} from './mocks/ogv.mock.js';
import OgvJS from '../src/plugin.js';

const baseOptions = () => ({base: '/node_modules/ogv/dist'});

afterEach(() => {
    browser.IS_IPHONE = false;
    browser.IS_IPAD = false;
    browser.IS_ANDROID = false;
    jest.clearAllMocks();
});

describe('registration', () => {
    it('registers itself as a Tech with video.js', () => {
        expect(Tech.registerTech).toHaveBeenCalledWith('OgvJS', OgvJS);
    });
});

describe('OgvJS.canPlayType', () => {
    it.each([
        ['video/ogg', 'maybe'],
        ['audio/ogg', 'maybe'],
        ['video/webm', 'maybe'],
        ['audio/webm', 'maybe']
    ])('returns "maybe" for %s', (type, expected) => {
        expect(OgvJS.canPlayType(type)).toBe(expected);
    });

    it.each([
        'video/mp4',
        'video/quicktime',
        'audio/mpeg',
        'not-a-real-mime-type',
        ''
    ])('returns "" for unsupported type %s', (type) => {
        expect(OgvJS.canPlayType(type)).toBe('');
    });
});

describe('OgvJS.canPlaySource', () => {
    it('delegates to canPlayType using the source type', () => {
        expect(OgvJS.canPlaySource({type: 'video/ogg'})).toBe('maybe');
        expect(OgvJS.canPlaySource({type: 'video/mp4'})).toBe('');
    });
});

describe('OgvJS.isSupported', () => {
    it('delegates to OGVCompat.supported', () => {
        OGVCompat.supported.mockReturnValueOnce(false);
        expect(OgvJS.isSupported()).toBe(false);
        expect(OGVCompat.supported).toHaveBeenCalledWith('OGVPlayer');
    });
});

describe('constructor', () => {
    it('throws when no base is configured for OGVLoader', () => {
        expect(() => new OgvJS({}, () => {})).toThrow(/base/i);
    });

    it('does not throw when no initial source is provided', () => {
        expect(() => new OgvJS(baseOptions(), () => {})).not.toThrow();
    });

    it('sets el_.src from options.source when provided', () => {
        const tech = new OgvJS({...baseOptions(), source: {src: 'movie.ogv'}}, () => {});

        expect(tech.el_.src).toBe('movie.ogv');
    });

    it('applies autoplay/loop/poster/preload when available on the element', () => {
        const tech = new OgvJS({
            ...baseOptions(),
            autoplay: true,
            loop: true,
            poster: 'poster.jpg',
            preload: 'auto'
        }, () => {});

        expect(tech.el_.autoplay).toBe(true);
        expect(tech.el_.loop).toBe(true);
        expect(tech.el_.poster).toBe('poster.jpg');
        expect(tech.el_.preload).toBe('auto');
    });

    it('calls the ready callback', () => {
        const ready = jest.fn();

        new OgvJS(baseOptions(), ready); // eslint-disable-line no-new
        expect(ready).toHaveBeenCalled();
    });
});

describe('iPhone loadedmetadata canvas fix', () => {
    it('removes inline canvas styles on iPhone when a canvas exists', () => {
        browser.IS_IPHONE = true;

        const tech = new OgvJS(baseOptions(), () => {});
        const canvas = document.createElement('canvas');

        canvas.style.width = '100px';
        canvas.style.margin = '10px';
        tech.el_.appendChild(canvas);

        const removeProperty = jest.spyOn(canvas.style, 'removeProperty');

        expect(() => tech.trigger('loadedmetadata')).not.toThrow();
        expect(removeProperty).toHaveBeenCalledWith('width');
        expect(removeProperty).toHaveBeenCalledWith('margin');
    });

    it('does not throw on iPhone for audio-only sources with no canvas', () => {
        browser.IS_IPHONE = true;

        const tech = new OgvJS(baseOptions(), () => {});

        expect(() => tech.trigger('loadedmetadata')).not.toThrow();
    });

    it('does nothing on non-iPhone devices', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        expect(() => tech.trigger('loadedmetadata')).not.toThrow();
    });
});

describe('duration', () => {
    it('returns the element duration when finite and truthy', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        tech.el_.duration = 42;
        expect(tech.duration()).toBe(42);
    });

    it.each([0, undefined, NaN, Infinity])('returns NaN when el_.duration is %p', (value) => {
        const tech = new OgvJS(baseOptions(), () => {});

        tech.el_.duration = value;
        expect(Number.isNaN(tech.duration())).toBe(true);
    });
});

describe('reset', () => {
    it('pauses, clears the source and reloads the element', () => {
        const tech = new OgvJS({...baseOptions(), source: {src: 'movie.ogv'}}, () => {});

        tech.reset();

        expect(tech.el_.pause).toHaveBeenCalled();
        expect(tech.el_.src).toBe('');
        expect(tech.el_.load).toHaveBeenCalled();
    });
});

describe('volume control', () => {
    it('sets the volume when the device allows it', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        tech.setVolume(0.5);
        expect(tech.el_.volume).toBe(0.5);
        expect(tech.volume()).toBe(0.5);
    });

    it.each(['IS_IPHONE', 'IS_IPAD'])('does not set the volume on %s', (flag) => {
        const tech = new OgvJS(baseOptions(), () => {});

        browser[flag] = true;
        tech.setVolume(0.5);
        expect(tech.el_.volume).toBe(1);
    });
});

describe('OgvJS.canControlVolume', () => {
    it('is false on iPhone and iPad', () => {
        browser.IS_IPHONE = true;
        expect(OgvJS.canControlVolume()).toBe(false);

        browser.IS_IPHONE = false;
        browser.IS_IPAD = true;
        expect(OgvJS.canControlVolume()).toBe(false);
    });

    it('is true elsewhere when the player exposes a volume property', () => {
        expect(OgvJS.canControlVolume()).toBe(true);
    });
});

describe('static feature flags', () => {
    it.each([
        ['canMuteVolume', true],
        ['canControlPlaybackRate', true],
        ['supportsNativeTextTracks', false],
        ['supportsFullscreenResize', true],
        ['supportsProgressEvents', true],
        ['supportsTimeupdateEvents', true]
    ])('%s() returns %p', (method, expected) => {
        expect(OgvJS[method]()).toBe(expected);
    });
});

describe('lazy feature properties', () => {
    it('exposes featuresVolumeControl based on canControlVolume', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        expect(tech.featuresVolumeControl).toBe(true);
    });
});

describe('playback controls passthrough', () => {
    it('play/pause/load delegate to the element', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        tech.play();
        expect(tech.el_.play).toHaveBeenCalled();

        tech.pause();
        expect(tech.el_.pause).toHaveBeenCalled();

        tech.load();
        expect(tech.el_.load).toHaveBeenCalled();
    });

    it('currentTime gets/sets the element currentTime', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        tech.setCurrentTime(10);
        expect(tech.currentTime()).toBe(10);
    });

    it('setCurrentTime logs instead of throwing when the element rejects the seek', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        Object.defineProperty(tech.el_, 'currentTime', {
            set: () => {
                throw new Error('not ready');
            },
            get: () => 0
        });

        expect(() => tech.setCurrentTime(5)).not.toThrow();
    });

    it('setPlaybackRate only sets it when the element supports it', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        tech.setPlaybackRate(2);
        expect(tech.playbackRate()).toBe(2);

        delete tech.el_.playbackRate;
        tech.setPlaybackRate(4);
        expect(tech.el_.playbackRate).toBeUndefined();
    });

    it('supportsFullScreen is always false', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        expect(tech.supportsFullScreen()).toBe(false);
    });

    it('exposes buffered/seekable/seeking/ended/networkState/readyState/error from the element', () => {
        const tech = new OgvJS(baseOptions(), () => {});

        expect(tech.buffered()).toBe(tech.el_.buffered);
        expect(tech.seekable()).toBe(tech.el_.seekable);
        expect(tech.seeking()).toBe(tech.el_.seeking);
        expect(tech.ended()).toBe(tech.el_.ended);
        expect(tech.networkState()).toBe(tech.el_.networkState);
        expect(tech.readyState()).toBe(tech.el_.readyState);
        expect(tech.error()).toBe(tech.el_.error);
    });
});
