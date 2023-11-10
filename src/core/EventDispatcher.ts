class EventDispatcher {
    addEventListener: (type: string, listener: (event: Event) => void) => void;
    removeEventListener: (type: string, listener: (event: Event) => void) => void;
    hasEventListener: (type: string, listener: (event: Event) => void) => boolean;
    dispatchEvent: (event: Event) => void;

    constructor() {
        const listeners = new Map<string, Set<(event: Event) => void>>();

        this.addEventListener = (type: string, listener: (event: Event) => void) => {
            if (!listeners.has(type)) {
                listeners.set(type, new Set());
            }

            listeners.get(type)!.add(listener);
        };

        this.removeEventListener = (type: string, listener: (event: Event) => void) => {
            if (!listeners.has(type)) {
                return;
            }

            listeners.get(type)!.delete(listener);
        };

        this.hasEventListener = (type: string, listener: (event: Event) => void) => {
            if (!listeners.has(type)) {
                return false;
            }

            return listeners.get(type)!.has(listener);
        };

        this.dispatchEvent = (event: Event) => {
            if (!listeners.has(event.type)) {
                return;
            }

            for (const listener of listeners.get(event.type)!) {
                listener(event);
            }
        };
    }
}

export { EventDispatcher };
