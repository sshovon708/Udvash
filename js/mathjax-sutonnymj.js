(function () {
    if (window.__sutonnyMjMathHelper) return;
    window.__sutonnyMjMathHelper = true;

    var UNICODE_BENGALI = /[\u0980-\u09FF]/;
    var BIJOY_SIGNATURE = /[\u0080-\u00FF\u2013-\u2122]/;
    // Bijoy borrows the cp1252 high range for Bangla glyphs, but these members of it are
    // ordinary English typography or standalone scientific symbols, so they prove nothing.
    // The common Bangla vowel signs live outside this set, so real Bangla still matches.
    var NEUTRAL = /[\s\u200B\u00A9\u00AE\u00AB\u00BB\u00B0\u00B1\u00B5\u00D7\u00F7\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u2122]/g;
    var MARK = 'data-sutonnymj';
    var ADJUST = '--sutonnymj-adjust';
    var SOURCE = 'data-sutonnymj-src';
    var LABELS = 'data-sutonnymj-labels';

    function isBijoy(text) {
        if (UNICODE_BENGALI.test(text)) return false;
        return BIJOY_SIGNATURE.test(text.replace(NEUTRAL, ''));
    }

    // mathjax renders every space inside 	ext{} as U+00A0, so a label of more than one word
    // never matches the spelling the server read off the source xml unless both sides are folded
    function normalize(text) {
        return text.replace(/\s+/g, ' ').trim();
    }

    // a Bijoy label can be plain ascii ("Zvc" is তাপ), which no content rule can tell from English.
    // the server reads the font off the source word xml and lists those labels on a wrapper element
    function declaredLabels(node) {
        var host = node.closest === undefined ? null : node.closest('[' + LABELS + ']');
        if (host === null) return null;
        if (host.__sutonnymjLabels === undefined) {
            host.__sutonnymjLabels = host.getAttribute(LABELS).split('|').map(function (part) {
                try { return normalize(decodeURIComponent(part)); } catch (error) { return normalize(part); }
            });
        }
        return host.__sutonnymjLabels;
    }

    function isDeclaredBijoy(node) {
        var labels = declaredLabels(node);
        return labels !== null && labels.indexOf(normalize(node.textContent)) >= 0;
    }

    function containsDeclaredLabel(span) {
        var labels = declaredLabels(span);
        if (labels === null) return false;
        var text = normalize(span.textContent);
        for (var i = 0; i < labels.length; i++) {
            if (labels[i].length > 0 && text.indexOf(labels[i]) >= 0) return true;
        }
        return false;
    }

    function each(root, selector, fn) {
        if (root === null || root === undefined || root.querySelectorAll === undefined) return;
        Array.prototype.forEach.call(root.querySelectorAll(selector), fn);
    }

    var exCache = {};

    function exOf(family) {
        if (exCache[family] === undefined) {
            var probe = document.createElement('div');
            probe.style.cssText = 'position:absolute;visibility:hidden;height:1ex;font-size:1000px;font-family:' + family;
            document.body.appendChild(probe);
            exCache[family] = probe.getBoundingClientRect().height;
            probe.parentNode.removeChild(probe);
        }
        return exCache[family];
    }

    // MathJax takes both the \text{} font and the equation's scale from one probe element it drops
    // inside the span. Naming SutonnyMJ there is what makes it size \xrightarrow to the real glyphs;
    // font-size-adjust holds the scale to the original font's x-height, which SutonnyMJ overstates
    // by nearly double and would otherwise blow the whole equation up.
    function injectMetricRule() {
        var style = document.createElement('style');
        style.textContent = '[' + MARK + '] mjx-test, [' + MARK + '] mjx-test * {'
            + ' font-family: SutonnyMJ !important;'
            + ' font-size-adjust: var(' + ADJUST + ') !important; }';
        document.head.appendChild(style);
    }

    function markBijoySpans(root) {
        each(root, '.math-tex', function (span) {
            if (span.hasAttribute(MARK)) return;
            if (isBijoy(span.textContent) === false && containsDeclaredLabel(span) === false) return;
            var originalEx = exOf(window.getComputedStyle(span).fontFamily);
            span.setAttribute(MARK, span.style.fontFamily || 'initial');
            if (originalEx > 0) span.style.setProperty(ADJUST, originalEx / 1000);
        });
    }

    function fixRenderedText(root) {
        each(root, 'mjx-mtext, mjx-container svg text', function (node) {
            if (isBijoy(node.textContent) || isDeclaredBijoy(node)) {
                node.style.setProperty('font-family', 'MJXZERO, SutonnyMJ', 'important');
                return;
            }
            var host = node.closest === undefined ? null : node.closest('[' + MARK + ']');
            if (host !== null) node.style.setProperty('font-family', host.getAttribute(MARK), 'important');
        });
    }

    // math typeset inside display:none measures every \text{} label as zero width, so stretchy
    // arrows never grow and the label spills over them once the block is toggled open. keep the
    // latex and render it again the first time the block is actually shown.
    var revealObserver = null;

    function getRevealObserver() {
        if (revealObserver === null && typeof IntersectionObserver === 'function') {
            revealObserver = new IntersectionObserver(function (entries) {
                Array.prototype.forEach.call(entries, function (entry) {
                    if (entry.isIntersecting === false) return;
                    revealObserver.unobserve(entry.target);
                    retypeset(entry.target);
                });
            });
        }
        return revealObserver;
    }

    function retypeset(span) {
        var source = span.getAttribute(SOURCE);
        span.removeAttribute(SOURCE);
        if (source === null) return;
        var mathJax = window.MathJax;
        if (typeof mathJax.typesetClear === 'function') mathJax.typesetClear([span]);
        span.textContent = source;
        mathJax.typesetPromise([span]);
    }

    function rememberHiddenSources(root) {
        if (getRevealObserver() === null) return;
        each(root, '.math-tex', function (span) {
            if (span.hasAttribute(SOURCE) || span.getClientRects().length > 0) return;
            span.setAttribute(SOURCE, span.textContent);
            // mathjax caches a label's width per font+text, and inside display:none every width
            // measures zero, so the latex has to be withheld rather than typeset and redone later
            span.textContent = '';
        });
    }

    function watchHiddenSpans(root) {
        var observer = getRevealObserver();
        if (observer === null) return;
        each(root, '[' + SOURCE + ']', function (span) {
            observer.observe(span);
        });
    }

    function overScopes(elements, fn) {
        if (elements === undefined || elements === null || elements.length === undefined || elements.length === 0) {
            fn(document);
            return;
        }
        Array.prototype.forEach.call(elements, fn);
    }

    var config = window.MathJax = window.MathJax || {};
    var startup = config.startup = config.startup || {};
    var previousPageReady = startup.pageReady;

    startup.pageReady = function () {
        var mathJax = window.MathJax;

        injectMetricRule();

        // re-typesets of ajax-loaded content bypass pageReady, so wrap the entry point too
        if (typeof mathJax.typesetPromise === 'function') {
            var typeset = mathJax.typesetPromise.bind(mathJax);
            mathJax.typesetPromise = function (elements) {
                overScopes(elements, markBijoySpans);
                overScopes(elements, rememberHiddenSources);
                return typeset(elements).then(function (result) {
                    overScopes(elements, fixRenderedText);
                    overScopes(elements, watchHiddenSpans);
                    return result;
                });
            };
        }

        // measuring against SutonnyMJ only works once the face is actually available
        var fontReady = (document.fonts && document.fonts.load)
            ? document.fonts.load('16px SutonnyMJ')['catch'](function () { })
            : Promise.resolve();

        return fontReady
            .then(function () {
                overScopes(null, markBijoySpans);
                overScopes(null, rememberHiddenSources);
                return previousPageReady ? previousPageReady() : mathJax.startup.defaultPageReady();
            })
            .then(function (value) {
                overScopes(null, fixRenderedText);
                overScopes(null, watchHiddenSpans);
                return value;
            });
    };
})();
