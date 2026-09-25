# claude-test
this is a test with claud tot se what it can make

## DayZ survivor login (`index.html`)

A fan-made, animated DayZ-style login page. One file, no build step: open `index.html` in a browser.

What happens:

1. **Intro**: black screen, a heartbeat line, and typewriter text. Press any key or click to skip.
2. **Wake up**: your eyes blink open onto a rainy night in the forest.
3. **Login**: your mouse is a flashlight. The page has parallax layers (mountains, a village with a church and a blinking radio tower, pine forest, the infected shambling along the treeline), drifting fog, rain, and random lightning.
4. **Wrong input**: the panel shakes and the screen flashes red like you're bleeding.
5. **Log in**: the camera runs forward through the trees into the fog, then a loading screen with survival tips appears.
6. **Welcome**: you wake up at dawn with your status bars (health, blood, water, food, temp). **Log out** takes you back to the night.

Extras: optional synthesized sound (rain, wind, thunder, heartbeat) via the **Sound** button, live server player counts and ping, "remember me", caps-lock warning, show/hide password, mobile layout, and `prefers-reduced-motion` support.

The form doesn't send anything anywhere. To make it real, replace the `wait(900)` fake auth in the submit handler with a call to your backend.
