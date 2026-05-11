---
layout: default
---

<div class="container">
    <div class="left-column">
        <h1 class="name">Luc Xie</h1>
        <button id="darkModeButton" class="theme-toggle" aria-label="Toggle dark mode"></button>
        <div class="social-links">
            <a>langxiao.xie [at] berkeley [dot] edu</a>
            <a href="https://linkedin.com/in/lucas-x-019b67174">LinkedIn</a>
            <a href="https://github.com/LangxiaoXie">GitHub</a>
        </div>
    </div>
    <div class="right-column">
        <p>
            Hi, I'm Luc — a student at UC Berkeley interested in quantitative finance, language learning, and building tools that are actually useful.
        </p>
        <p>
            I like systems that are elegant under the hood: a well-reasoned trade signal, a vocabulary app that respects your time, a website that loads fast. Most of what I build starts as something I wanted for myself.
        </p>
        <details>
        <summary>More</summary>
        <p>
            I'm drawn to problems at the intersection of data and decision-making — whether that's allocating capital across sectors or figuring out the most efficient path from A1 to B2 in a foreign language.
        </p>
        <p>
            Outside of work, I'm interested in Chinese history, classical languages, and the occasional endurance sport.
        </p>
        </details>
        <div class="game-controls">
            <button id="startButton">Start Game of Life</button>
            <button id="drawButton">Draw Mode</button>
            <button id="clearButton">Clear</button>
        </div>
    </div>
</div>

<canvas id="gameCanvas"></canvas>
<canvas id="interactionCanvas"></canvas>

<script src="/assets/js/game-of-life.js"></script>
