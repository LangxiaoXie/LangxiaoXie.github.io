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
            Hi there! I'm Luc. I believe the most important question one can ask is still regarding the good life.
        </p>
        <p>
            As of spring 2026, I am an independent researcher working on poverty, energy, and AI safety. Outside of my research, I read great books, milk cows, and hire interesting professors at Deep Springs College.
        </p>
        <p>
I am interested in the intellectual and material formation of modernity, especially as they pertain to core–periphery relations, the project of Enlightenment, and the alignment problems posed by advanced AI systems.        </p>
        <details>
        <summary>More</summary>
        <p>
            The thinkers, writers, and artists who have most shaped me are Jacob Lurie, Zhuangzi, Plato, and Mozart. For me, they represent fortitude, temperance, prudence, and compassion
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
