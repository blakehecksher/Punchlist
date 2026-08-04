# Rotate photo control

- Replaced the third photo control's reset-position behavior with a clockwise 90-degree image rotation.
- Rotation keeps the current pan and zoom position, updates the displayed image, and persists the rotated JPEG in IndexedDB.
- Added accessible labels and titles for zoom, rotate, and remove photo controls.
- Verified the control in the live preview and confirmed the rotated image remains after reload.
- `npm.cmd run lint` and `npm.cmd run build` pass.
