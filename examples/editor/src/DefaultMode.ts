import { UndoManager } from "./UndoManager";
import { ModeManager } from "./ModeManager";
import { SelectionManager } from "./SelectionManager";
import { InputMode } from "./InputMode";
import { Engine } from "./Engine";

class DefaultMode implements InputMode {
    exit: () => void;

    constructor(engine: Engine) {
        const handleEnterGrabMode = () => {
            if (SelectionManager.selectedSplat) {
                ModeManager.enterMode("grab");
            }
        };

        const handleEnterRotateMode = () => {
            if (SelectionManager.selectedSplat) {
                ModeManager.enterMode("rotate");
            }
        };

        const handleEnterScaleMode = () => {
            if (SelectionManager.selectedSplat) {
                ModeManager.enterMode("scale");
            }
        };

        const handleDelete = () => {
            if (SelectionManager.selectedSplat) {
                engine.scene.removeObject(SelectionManager.selectedSplat);
                SelectionManager.selectedSplat = null;
            }
        };

        const handleUndo = () => {
            UndoManager.undo();
        };

        const handleClearSelection = (event: KeyboardEvent) => {
            if (event.altKey) {
                SelectionManager.selectedSplat = null;
            }
        };

        const handleClick = () => {
            const mousePosition = engine.mouseManager.currentMousePosition;
            const result = engine.intersectionTester.testPoint(mousePosition.x, mousePosition.y);
            if (result !== null) {
                SelectionManager.selectedSplat = result;
            } else {
                SelectionManager.selectedSplat = null;
            }
        };

        engine.keyboardManager.registerKey("g", handleEnterGrabMode);
        engine.keyboardManager.registerKey("r", handleEnterRotateMode);
        engine.keyboardManager.registerKey("s", handleEnterScaleMode);
        engine.keyboardManager.registerKey("x", handleDelete);
        engine.keyboardManager.registerKey("z", handleUndo);
        engine.keyboardManager.registerKey("a", handleClearSelection);
        engine.mouseManager.registerMouse("click", handleClick);
        engine.orbitControls.enabled = true;

        this.exit = () => {
            engine.keyboardManager.unregisterKey("g");
            engine.keyboardManager.unregisterKey("r");
            engine.keyboardManager.unregisterKey("s");
            engine.keyboardManager.unregisterKey("x");
            engine.keyboardManager.unregisterKey("z");
            engine.keyboardManager.unregisterKey("a");
            engine.mouseManager.unregisterMouse("click");
            engine.orbitControls.enabled = false;
        };
    }
}

export { DefaultMode };
