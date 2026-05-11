---
layout: default
---

<div class="container">
    <div class="left-column">
        <h1 class="name">Luc Xie</h1>
        <button id="darkModeButton" class="theme-toggle" aria-label="Toggle dark mode"></button>
        <div class="social-links">
            <a>langxiao [dot] xie [at] berkeley [dot] edu</a>
            <a href="https://linkedin.com/in/lucas-x-019b67174">LinkedIn</a>
            <a href="https://github.com/LangxiaoXie">GitHub</a>
</div>
    </div>
    <div class="right-column">
        <p>
            Hi there! I'm Luc. I believe the most important question one can ask is still regarding the good life, yet the question has been forgotten due to recent rapid changes in our society. As of spring 2026, I am an independent researcher working on AI safety, poverty, and energy. Outside of my research, I read great books, milk cows, and hire interesting professors at Deep Springs College.

I am interested in the learning and generalization dynamics of machine learning models, especially as it pertains to (mis)alignment.
        </p>
        <p>
            xxx
        </p>
        <details>
        <summary>More</summary>
        <p>
            The thinkers, writers, and artists who have most shaped me are G.W.F. Hegel, Jacob Lurie, Hai Zi, and Mozart. For me, they represent structure, restraint, imagination, and rhythm.
        </p>
        <p>
            Outside of work, I'm interested in intellectual history, language acquisition, and the backcountry.
        </p>
        </details>
        <div class="game-controls">
            <button id="startButton">Initiate Attack</button>
            <button id="drawButton">Draw Mode</button>
            <button id="clearButton">Clear</button>
        </div>
    </div>
</div>

<canvas id="gameCanvas"></canvas>
<canvas id="interactionCanvas"></canvas>

<script src="/assets/js/game-of-life.js"></script>
