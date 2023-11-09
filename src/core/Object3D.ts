import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";
import { EventDispatcher } from "./EventDispatcher";

class Object3D extends EventDispatcher {
    private _position: Vector3;
    private _rotation: Quaternion;
    private _changeEvent: Event;

    constructor() {
        super();

        this._position = new Vector3();
        this._rotation = new Quaternion();
        this._changeEvent = { type: "change" } as Event;
    }

    get position() {
        return this._position;
    }

    set position(position: Vector3) {
        if (!this._position.equals(position)) {
            this._position = position;
            this.dispatchEvent(this._changeEvent);
        }
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(rotation: Quaternion) {
        if (!this._rotation.equals(rotation)) {
            this._rotation = rotation;
            this.dispatchEvent(this._changeEvent);
        }
    }
}

export { Object3D };
