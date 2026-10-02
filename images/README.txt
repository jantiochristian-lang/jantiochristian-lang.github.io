STERLING MERCHANT FINANCE — IMAGE & MEDIA SLOTS
===============================================
Any missing file degrades to a labelled placeholder, never a broken image.
So the site is always safe to show, half-filled.

IN PLACE
--------
ambient.mp4          index.html — hero media. Loops forever, silent, autoplay.
                     1280x720, 1.42 MB (from sterling_video_loop_v2). Audio stripped; tail
                     faded to black to match the black opening frame, so the loop seam is
                     invisible. If this file is removed, a live generative
                     contour field renders in its place.
ambient-poster.jpg   Still shown for the split second before the video decodes.
method.jpg           index.html + mandate.html — the Method / Underwriting card.
                     1500x925. Bleeds left-to-right into the dark text panel.

portrait.jpg         leadership.html — Roger, 1100x1375 (4:5), rendered
                     greyscale by CSS. A real photograph now, not a video still.
favicon.png          Browser tab icon.

STILL EMPTY
-----------
capabilities.jpg     capabilities.html — wide photo band. 2.6:1, min 1800px wide.

ADD MORE ANYWHERE
-----------------
Paste this block inside any <div class="wrap"> to create a new photo band:

  <figure class="photoband">
    <img src="images/YOURFILE.jpg" alt="">
    <figcaption>One line on what this shows.</figcaption>
    <div class="ghost">Photo band slot</div>
  </figure>

SPECS
-----
Wide bands   2.6:1, 1800px wide, JPEG quality ~84, progressive
Portraits    4:5, 1200px tall
Video        silent, under 2 MB, fades from and to black so the loop is clean
