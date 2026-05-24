/**
 * Pass as `raycast={noRaycast}` to take a mesh out of pointer-event
 * intersection tests. Three.js raycasts every visible mesh by default, so a
 * stage full of decorative geometry slows tap/click on mobile noticeably.
 *
 * Only mounting puppets (the things the user actually clicks) keep the
 * default raycaster — everything else (theater frame, water surface, seats,
 * particles, pavilion model) opts out via this helper.
 */
export const noRaycast = () => {}
