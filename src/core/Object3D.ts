import { Vector3 } from "../math/Vector3";
import { Quaternion } from "../math/Quaternion";
import { EventDispatcher } from "../events/EventDispatcher";
import { Matrix4 } from "../math/Matrix4";
import { ObjectChangedEvent } from "../events/Events";

abstract class Object3D extends EventDispatcher {
    public positionChanged: boolean = false;
    public rotationChanged: boolean = false;
    public scaleChanged: boolean = false;

    protected _position: Vector3 = new Vector3();
    protected _rotation: Quaternion = new Quaternion();
    protected _scale: Vector3 = new Vector3(1, 1, 1);
    protected _transform: Matrix4 = new Matrix4();

    protected _changeEvent = new ObjectChangedEvent(this);

    update: () => void;
    applyPosition: () => void;
    applyRotation: () => void;
    applyScale: () => void;
    raiseChangeEvent: () => void;

    constructor() {
        super();

        this.update = () => {};

        this.applyPosition = () => {
            this.position = new Vector3();
        };

        this.applyRotation = () => {
            this.rotation = new Quaternion();
        };

        this.applyScale = () => {
            this.scale = new Vector3(1, 1, 1);
        };

        this.raiseChangeEvent = () => {
            this.dispatchEvent(this._changeEvent);
        };
    }

    protected _updateMatrix() {
        this._transform = Matrix4.Compose(this._position, this._rotation, this._scale);
    }

    get position() {
        return this._position;
    }

    set position(position: Vector3) {
        if (!this._position.equals(position)) {
            this._position = position;
            this.positionChanged = true;
            this._updateMatrix();
            this.dispatchEvent(this._changeEvent);
        }
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(rotation: Quaternion) {
        if (!this._rotation.equals(rotation)) {
            this._rotation = rotation;
            this.rotationChanged = true;
            this._updateMatrix();
            this.dispatchEvent(this._changeEvent);
        }
    }

    get scale() {
        return this._scale;
    }

    set scale(scale: Vector3) {
        if (!this._scale.equals(scale)) {
            this._scale = scale;
            this.scaleChanged = true;
            this._updateMatrix();
            this.dispatchEvent(this._changeEvent);
        }
    }

    get forward() {
        let forward = new Vector3(0, 0, 1);
        forward = this.rotation.apply(forward);
        return forward;
    }

    get transform() {
        return this._transform;
    }
}

export { Object3D };
