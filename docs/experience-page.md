# Connected intelligence concept



Open `/experience`. This is an additional landing page, outside the existing `(site)` layout, with no database lookup on its critical render path. Existing pages, layouts, shared styles and package dependencies are unchanged.



## Motion asset



The current source is the user-provided upscaled original `Creating_3D_video_transition_17583feb_1080p.mp4`: 1920 × 1080, 24 fps, 190 frames (7.917 seconds). The complete opening is preserved from frame zero, with no trim. It replaces the later sector/map clip at the user's request.



The page uses all 190 source frames, with native 1920 × 1080 desktop WebP frames at quality 90 and smaller 640 × 360 mobile frames, under `public/experience/original-upscaled/`. The opening and reduced-motion posters come from this same source. The current scroll presentation is described below. Alternative earlier assets remain available but are no longer referenced.



Three workers prioritise the current frame, nearby frames and coarse sequence anchors. Decoded ImageBitmap memory is bounded at 32 desktop frames and 40 mobile frames; eviction explicitly closes bitmaps. Playback is scroll-controlled, reverses naturally and displays the full image without object-fit cropping. Visible mobile labels and image alternative text describe the four capabilities shown in the actual clip.



Regenerate with `scripts/prepare-brand-reveal.py SOURCE --output public/experience/original-upscaled --start-frame 0 --desktop-width 1920 --quality 90`, using Python with PyAV and Pillow. The source video remains in Downloads and is not needed at runtime.



Reduced motion uses the final still, disables decorative animation and removes the long sticky scroll. The poster, heading, navigation and content remain available before hydration or without JavaScript. An early keyboard-accessible link skips the motion section.



## Interaction



The KYC, financial and credit tabs are illustrative, with labelled synthetic data. Their review buttons run a local three-step demonstration; they do not submit documents or perform a real assessment. Arrow keys, Home and End navigate the tabs. Workspace links lead to the existing `/login` page.



All added CSS selectors and keyframes use the `ax-` prefix because the existing custom Turbopack CSS loader bypasses normal CSS Module exports. No shared loader configuration was changed.



## Check locally



```powershell

npm run build

npm run start -- -p 3001

$env:EXPERIENCE_URL = 'http://localhost:3001'

node scripts/experience-check.mjs

```



Browser results and desktop/mobile screenshots are written to `.taste-skill/experience/` using the existing Taste Skill browser harness.


## Immersive presentation

The video now fills a viewport-sized sticky stage over three screen heights of desktop scrolling. The opening emblem sits to the right of the left-aligned headline, then moves into the full composition as the headline recedes. No numerical counter, progress bar, phase numbering or loading-style display is rendered.

`backdrops.json` stores four corner-colour samples per encoded source frame. The stage interpolates those colours into its surrounding gradient as the canvas changes frame. The transparent canvas and edge mask blend the footage into the backdrop. Other light sections use the same cool neutral colour family. Regenerating frames also regenerates backdrop samples.
