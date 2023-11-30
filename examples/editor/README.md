# gsplat.js editor

This simple editor showcases the realtime editing capabilities of gsplat.js.

## Usage

-   Import gaussian splatting objects from a file (`.ply` or `.splat`) by dragging and dropping them into the editor window.
-   Download splats as a `.splat` file by clicking the download button in the top right corner.s
    -   If an object is selected, only that object will be downloaded. Otherwise, all objects will be combined and downloaded.
-   Use the controls below to edit the splats.

## Controls

### Camera

-   `Middle Mouse` - Orbit camera
-   `Shift + Middle Mouse` - Pan camera
-   `Scroll Wheel` - Zoom camera

### Editing

-   `Left Mouse` - Select an object / confirm action
-   `Right Mouse` - Cancel action
-   `G` - Grab selected object
-   `R` - Rotate selected object
-   `S` - Scale selected object
-   `X` - Delete selected object / lock to X axis
-   `Y` - Lock to Y axis
-   `Z` - Lock to Z axis
