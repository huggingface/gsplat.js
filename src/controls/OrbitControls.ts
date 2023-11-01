import type { Camera } from "../cameras/Camera";
import { Matrix3 } from "../math/Matrix3";
import { Vector3 } from "../math/Vector3";

class OrbitControls {
    minBeta: number = (5 * Math.PI) / 180;
    maxBeta: number = (85 * Math.PI) / 180;
    minZoom: number = 0.1;
    maxZoom: number = 30;
    orbitSpeed: number = 1;
    panSpeed: number = 1;
    zoomSpeed: number = 1;
    dampening: number = 0.3;

    update: () => void;
    dispose: () => void;

    constructor(camera: Camera, domElement: HTMLElement) {
        let target = new Vector3();
        let alpha = 0;
        let beta = 0;
        let radius = 5;

        const desiredTarget = target.clone();
        let desiredAlpha = alpha;
        let desiredBeta = beta;
        let desiredRadius = radius;

        let dragging = false;
        let panning = false;
        let lastX = 0;
        let lastY = 0;

        const computeZoomNorm = () => {
            return 0.1 + (0.9 * (desiredRadius - this.minZoom)) / (this.maxZoom - this.minZoom);
        };

        const onPointerDown = (e: PointerEvent) => {
            preventDefault(e);

            dragging = true;
            if (e.pointerType === "touch") {
                panning = e.pointerId === 2;
            } else {
                panning = e.button === 2;
            }
            lastX = e.clientX;
            lastY = e.clientY;
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("pointercancel", onPointerUp);
        };

        const onPointerUp = (e: PointerEvent) => {
            preventDefault(e);

            dragging = false;
            panning = false;
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
        };

        const onPointerMove = (e: PointerEvent) => {
            preventDefault(e);

            if (!dragging) return;

            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const zoomNorm = computeZoomNorm();

            if (panning) {
                const panX = -dx * this.panSpeed * 0.01 * zoomNorm;
                const panY = -dy * this.panSpeed * 0.01 * zoomNorm;
                const R = camera.rotation.buffer;
                const right = new Vector3(R[0], R[3], R[6]);
                const up = new Vector3(R[1], R[4], R[7]);
                desiredTarget.add(right.multiply(panX));
                desiredTarget.add(up.multiply(panY));
            } else {
                desiredAlpha -= dx * this.orbitSpeed * 0.005;
                desiredBeta += dy * this.orbitSpeed * 0.005;
                desiredBeta = Math.min(Math.max(desiredBeta, this.minBeta), this.maxBeta);
            }

            lastX = e.clientX;
            lastY = e.clientY;
        };

        const onWheel = (e: WheelEvent) => {
            preventDefault(e);

            const zoomNorm = computeZoomNorm();
            desiredRadius += e.deltaY * this.zoomSpeed * 0.02 * zoomNorm;
            desiredRadius = Math.min(Math.max(desiredRadius, this.minZoom), this.maxZoom);
        };

        const lerp = (a: number, b: number, t: number) => {
            return (1 - t) * a + t * b;
        };

        this.update = () => {
            alpha = lerp(alpha, desiredAlpha, this.dampening);
            beta = lerp(beta, desiredBeta, this.dampening);
            radius = lerp(radius, desiredRadius, this.dampening);
            target = target.lerp(desiredTarget, this.dampening);

            const x = target.x + radius * Math.sin(alpha) * Math.cos(beta);
            const y = target.y - radius * Math.sin(beta);
            const z = target.z - radius * Math.cos(alpha) * Math.cos(beta);
            camera.position.set(x, y, z);

            const direction = target.clone().subtract(camera.position).normalize();
            const rx = Math.asin(-direction.y);
            const ry = Math.atan2(direction.x, direction.z);
            camera.rotation = Matrix3.RotationFromEuler(new Vector3(rx, ry, 0));
        };

        const preventDefault = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };

        this.dispose = () => {
            domElement.removeEventListener("dragenter", preventDefault);
            domElement.removeEventListener("dragover", preventDefault);
            domElement.removeEventListener("dragleave", preventDefault);
            domElement.removeEventListener("contextmenu", preventDefault);

            domElement.removeEventListener("pointerdown", onPointerDown);
            domElement.removeEventListener("pointermove", onPointerMove);
            domElement.removeEventListener("wheel", onWheel);
        };

        domElement.addEventListener("dragenter", preventDefault);
        domElement.addEventListener("dragover", preventDefault);
        domElement.addEventListener("dragleave", preventDefault);
        domElement.addEventListener("contextmenu", preventDefault);

        domElement.addEventListener("pointerdown", onPointerDown);
        domElement.addEventListener("pointermove", onPointerMove);
        domElement.addEventListener("wheel", onWheel);

        this.update();
    }
}

export { OrbitControls };
