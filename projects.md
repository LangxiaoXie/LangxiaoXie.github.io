---
layout: default
title: Projects
permalink: /projects/
---

<div class="page-grid">
    <div class="left-col">
        <h1 class="page-title">Projects</h1>
        <div class="page-meta">
            <span>langxiao [dot] xie [at] berkeley [dot] edu</span>
            <a href="https://linkedin.com/in/lucas-x-019b67174">LinkedIn</a>
            <a href="https://github.com/LangxiaoXie">GitHub</a>
        </div>
    </div>
    <div class="right-col">
        <div class="entries">
            <div class="entry">
                <p class="entry-title"><a href="https://www.bricnbrac.com/">Atelier Map</a></p>
                <p class="entry-desc">A living map of a product, built out of the work coding agents do on it. An agent can touch dozens of files and report back in a single sentence, which leaves the person who owns the product steadily less able to say what it contains; Atelier Map reconstructs what exists, what changed in a session, and what changed because of the last request. In its first iteration at Bric&amp;Brac; source is private.</p>
            </div>
            <div class="entry">
                <p class="entry-title"><a href="https://www.bricnbrac.com/">Purl</a></p>
                <p class="entry-desc">The product I work on as a software engineer at Bric&amp;Brac, across the backend foundations and the client applications. Source is private.</p>
            </div>
            <div class="entry">
                <p class="entry-title"><a href="https://github.com/tatuylonen/wiktextract/pull/1705">wiktextract — Spanish deixis tags</a></p>
                <p class="entry-desc">A Wiktionary dump parser that feeds kaikki.org and a range of downstream lexical projects. My patch repairs the Spanish demonstrative pronoun tables, whose spanning title header was missing from the inflection map, so every form came out carrying an error tag alongside the wrong proximal, medial, or distal deixis. Merged.</p>
            </div>
            <div class="entry">
                <p class="entry-title"><a href="https://github.com/EleutherAI/lm-evaluation-harness/pull/4120">lm-evaluation-harness — EconLogicQA</a></p>
                <p class="entry-desc">EleutherAI's framework for few-shot evaluation of language models. I added EconLogicQA, whose 130 test questions each present four interconnected events from a business or supply-chain narrative and ask the model to order them by logical rather than chronological precedence — sequencing economic cause and effect, where the harness previously covered economics only through recall-based MMLU slices.</p>
            </div>
            <div class="entry">
                <p class="entry-title"><a href="https://github.com/UKGovernmentBEIS/inspect_evals/pull/2447">inspect_evals — PaperBench blacklist monitor</a></p>
                <p class="entry-desc">A collection of evals for Inspect AI. PaperBench's blacklist monitor stops an agent fetching the paper's reference implementation, but it matched only clone URLs that put host and path either side of a slash, so scp-like SSH syntax, where a colon separates the two, went undetected. My patch normalises that form before the check runs.</p>
            </div>
            <div class="entry">
                <p class="entry-title">Sparse Autoencoder Playground</p>
                <p class="entry-desc">A sparse autoencoder written to be read in one sitting. It is trained first on synthetic data whose features are known, so that recovery can actually be checked, and then pointed at GPT-2 activations. Ships with a terminal walkthrough that draws its plots as coloured blocks, so the whole thing runs without a browser.</p>
            </div>
            <div class="entry">
                <p class="entry-title"><a href="https://github.com/LangxiaoXie/rotation-momentum-strategy">Rotation Momentum Strategy</a></p>
                <p class="entry-desc">A quantitative sector rotation system for A-share ETFs. Uses a three-factor momentum score — bias, slope, and efficiency — to rank Shenwan Level-1 sectors monthly and select the top-scoring ETF. Includes a trend filter on the CSI 300 index and automated WeChat push notifications via Server酱 on the last trading day of each month. Backtests at 13.9% CAGR against 8.2% for the CSI 300.</p>
            </div>
            <div class="entry">
                <p class="entry-title"><a href="https://github.com/LangxiaoXie/vocabulum">Vocabulum</a></p>
                <p class="entry-desc">A browser-based spaced-repetition vocabulary app for German, French, Spanish, and Latin. Uses a simplified SM-2 algorithm with four rating buttons and CEFR-leveled word lists sourced from kaikki.org and OpenSubtitles frequency data. No backend — runs entirely from static files.</p>
            </div>
        </div>
    </div>
</div>
