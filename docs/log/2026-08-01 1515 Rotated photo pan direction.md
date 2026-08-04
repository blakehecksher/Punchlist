# Rotated photo pan direction

- Fixed rotated-photo panning that could feel reversed on the vertical axis.
- The photo background now scales from a true cover fit, including the rotated image's actual aspect ratio, before applying zoom.
- Verified a rotated photo in the live preview: dragging up increases the visible vertical position and dragging down returns it in the expected direction.
- `npm.cmd run lint` and `npm.cmd run build` pass.
