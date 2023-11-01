import type { Camera } from "../cameras/Camera";
import { Matrix3 } from "../math/Matrix3";
import { Vector3 } from "../math/Vector3";

class OrbitControls {
    minAngle: number = -90;
    maxAngle: number = 90;
    minZoom: number = 0.1;
    maxZoom: number = 30;
    orbitSpeed: number = 1;
    panSpeed: number = 1;
    zoomSpeed: number = 1;
    dampening: number = 0.1;

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
        let lastDist = 0;
        let lastX = 0;
        let lastY = 0;

        const computeZoomNorm = () => {
            return 0.1 + (0.9 * (desiredRadius - this.minZoom)) / (this.maxZoom - this.minZoom);
        };

        const onMouseDown = (e: MouseEvent) => {
            preventDefault(e);

            dragging = true;
            panning = e.button === 2;
            lastX = e.clientX;
            lastY = e.clientY;
            window.addEventListener("mouseup", onMouseUp);
        };

        const onMouseUp = (e: MouseEvent) => {
            preventDefault(e);

            dragging = false;
            panning = false;
            window.removeEventListener("mouseup", onMouseUp);
        };

        const onMouseMove = (e: MouseEvent) => {
            preventDefault(e);

            if (!dragging) return;

            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;

            if (panning) {
                const zoomNorm = computeZoomNorm();
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
                desiredBeta = Math.min(
                    Math.max(desiredBeta, (this.minAngle * Math.PI) / 180),
                    (this.maxAngle * Math.PI) / 180,
                );
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

        const onTouchStart = (e: TouchEvent) => {
            preventDefault(e);

            if (e.touches.length === 1) {
                dragging = true;
                panning = false;
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
                lastDist = 0;
            } else if (e.touches.length === 2) {
                dragging = true;
                panning = true;
                lastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const distX = e.touches[0].clientX - e.touches[1].clientX;
                const distY = e.touches[0].clientY - e.touches[1].clientY;
                lastDist = Math.sqrt(distX * distX + distY * distY);
            }
        };

        const onTouchEnd = (e: TouchEvent) => {
            preventDefault(e);

            dragging = false;
            panning = false;
        };

        const onTouchMove = (e: TouchEvent) => {
            preventDefault(e);

            if (!dragging) return;

            if (panning) {
                const zoomNorm = computeZoomNorm();

                const distX = e.touches[0].clientX - e.touches[1].clientX;
                const distY = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(distX * distX + distY * distY);
                const delta = lastDist - dist;
                desiredRadius += delta * this.zoomSpeed * 0.1 * zoomNorm;
                desiredRadius = Math.min(Math.max(desiredRadius, this.minZoom), this.maxZoom);
                lastDist = dist;

                const touchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const touchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const dx = touchX - lastX;
                const dy = touchY - lastY;
                const R = camera.rotation.buffer;
                const right = new Vector3(R[0], R[3], R[6]);
                const up = new Vector3(R[1], R[4], R[7]);
                desiredTarget.add(right.multiply(-dx * this.panSpeed * 0.02 * zoomNorm));
                desiredTarget.add(up.multiply(-dy * this.panSpeed * 0.02 * zoomNorm));
                lastX = touchX;
                lastY = touchY;
            } else {
                const dx = e.touches[0].clientX - lastX;
                const dy = e.touches[0].clientY - lastY;

                desiredAlpha -= dx * this.orbitSpeed * 0.005;
                desiredBeta += dy * this.orbitSpeed * 0.005;
                desiredBeta = Math.min(
                    Math.max(desiredBeta, (this.minAngle * Math.PI) / 180),
                    (this.maxAngle * Math.PI) / 180,
                );

                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            }
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

            domElement.removeEventListener("mousedown", onMouseDown);
            domElement.removeEventListener("mousemove", onMouseMove);
            domElement.removeEventListener("wheel", onWheel);

            domElement.removeEventListener("touchstart", onTouchStart);
            domElement.removeEventListener("touchend", onTouchEnd);
            domElement.removeEventListener("touchmove", onTouchMove);
        };

        domElement.addEventListener("dragenter", preventDefault);
        domElement.addEventListener("dragover", preventDefault);
        domElement.addEventListener("dragleave", preventDefault);
        domElement.addEventListener("contextmenu", preventDefault);

        domElement.addEventListener("mousedown", onMouseDown);
        domElement.addEventListener("mousemove", onMouseMove);
        domElement.addEventListener("wheel", onWheel);

        domElement.addEventListener("touchstart", onTouchStart);
        domElement.addEventListener("touchend", onTouchEnd);
        domElement.addEventListener("touchmove", onTouchMove);

        this.update();
    }
}

export { OrbitControls };
