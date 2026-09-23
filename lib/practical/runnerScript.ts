/**
 * Skrypt sprawdzający wstrzykiwany do iframe z pracą ucznia.
 *
 * Działa w tym samym sandboxie co kod ucznia (iframe bez allow-same-origin),
 * więc nie ma dostępu do sesji nauczyciela. Referencje do API przeglądarki
 * bierzemy na starcie — zanim wykona się kod ucznia — żeby podmiana
 * querySelector przez ucznia nie zafałszowała wyniku. To utrudnienie, nie
 * gwarancja: skrypt ucznia działa w tym samym kontekście, więc wyniki testów
 * traktujemy jako pomoc dla nauczyciela, a nie dowód nie do podważenia.
 */
export const RUNNER_SCRIPT = String.raw`
(function () {
  var D = document;
  var pristine = {
    qsa: Document.prototype.querySelectorAll,
    qs: Document.prototype.querySelector,
    gcs: window.getComputedStyle,
    attr: Element.prototype.getAttribute,
    now: Date.now
  };
  function all(sel) { try { return Array.prototype.slice.call(pristine.qsa.call(D, sel)); } catch (e) { return null; } }
  function one(sel) { var l = all(sel); return l && l.length ? l[0] : null; }
  function text(el) { return (el.textContent || "").replace(/\s+/g, " ").trim(); }

  function matches(actual, mode, expected, ignoreCase) {
    var a = actual == null ? "" : String(actual);
    var b = expected == null ? "" : String(expected);
    if (mode === "regex") {
      try { return new RegExp(b, ignoreCase ? "i" : "").test(a); } catch (e) { return false; }
    }
    if (ignoreCase) { a = a.toLowerCase(); b = b.toLowerCase(); }
    if (mode === "contains") return a.indexOf(b) !== -1;
    return a === b;
  }

  // normalizacja wartości CSS: kolory do rgb(), jednostki do px —
  // przez ustawienie wartości na pomocniczym elemencie i odczyt wyniku
  function normalizeCss(prop, value) {
    var probe = D.createElement("div");
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    probe.style.width = "100px";
    probe.style.fontSize = "16px";
    try { probe.style.setProperty(prop, value); } catch (e) {}
    D.body.appendChild(probe);
    var computed = "";
    try { computed = pristine.gcs.call(window, probe).getPropertyValue(prop).trim(); } catch (e) {}
    probe.remove();
    return computed || String(value).trim();
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, Math.min(2000, Math.max(0, ms || 0))); }); }

  function setValue(el, value) {
    var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, "value");
    if (setter && setter.set) setter.set.call(el, value); else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function checkExpect(exp) {
    var el = one(exp.selector);
    if (!el) return { passed: false, message: "Nie znaleziono elementu „" + exp.selector + "” po wykonaniu kroków." };
    if (exp.mode === "exists") return { passed: true, message: "Element „" + exp.selector + "” pojawił się." };
    if (exp.mode === "attribute") {
      var got = pristine.attr.call(el, exp.attribute);
      return {
        passed: matches(got, "equals", exp.value, exp.ignoreCase),
        message: "Atrybut " + exp.attribute + ": oczekiwano „" + exp.value + "”, znaleziono „" + (got == null ? "brak" : got) + "”."
      };
    }
    var got2 = text(el);
    return {
      passed: matches(got2, exp.mode, exp.value, exp.ignoreCase),
      message: "Tekst elementu „" + exp.selector + "”: oczekiwano „" + exp.value + "”, znaleziono „" + got2 + "”."
    };
  }

  async function runTest(test) {
    switch (test.type) {
      case "selector_count": {
        var els = all(test.selector);
        if (els === null) return { passed: false, message: "Nieprawidłowy selektor CSS: " + test.selector };
        var n = els.length;
        var okMin = test.min === undefined || test.min === null || n >= test.min;
        var okMax = test.max === undefined || test.max === null || n <= test.max;
        var want = test.min !== undefined && test.min !== null && test.max !== undefined && test.max !== null && test.min === test.max
          ? "dokładnie " + test.min
          : (test.min !== undefined && test.min !== null ? "min. " + test.min : "") +
            (test.max !== undefined && test.max !== null ? (test.min !== undefined && test.min !== null ? ", " : "") + "maks. " + test.max : "");
        return { passed: okMin && okMax, message: "Elementy „" + test.selector + "”: oczekiwano " + want + ", znaleziono " + n + "." };
      }
      case "selector_text": {
        var el = one(test.selector);
        if (!el) return { passed: false, message: "Nie znaleziono elementu „" + test.selector + "”." };
        var got = text(el);
        return {
          passed: matches(got, test.mode, test.value, test.ignoreCase),
          message: "Tekst „" + test.selector + "”: oczekiwano „" + test.value + "”, znaleziono „" + got + "”."
        };
      }
      case "selector_attribute": {
        var el2 = one(test.selector);
        if (!el2) return { passed: false, message: "Nie znaleziono elementu „" + test.selector + "”." };
        var got2 = pristine.attr.call(el2, test.attribute);
        return {
          passed: got2 !== null && matches(got2, test.mode, test.value, test.ignoreCase),
          message: "Atrybut " + test.attribute + " elementu „" + test.selector + "”: oczekiwano „" + test.value +
            "”, znaleziono „" + (got2 === null ? "brak atrybutu" : got2) + "”."
        };
      }
      case "css_computed": {
        var el3 = one(test.selector);
        if (!el3) return { passed: false, message: "Nie znaleziono elementu „" + test.selector + "”." };
        var actual = "";
        try { actual = pristine.gcs.call(window, el3).getPropertyValue(test.property).trim(); } catch (e) {}
        var expected = normalizeCss(test.property, test.expected);
        return {
          passed: actual === expected || actual === String(test.expected).trim(),
          message: "Styl " + test.property + " dla „" + test.selector + "”: oczekiwano „" + expected + "”, obliczono „" + (actual || "brak") + "”."
        };
      }
      case "html_lang_doctype": {
        var hasDoctype = !!D.doctype && String(D.doctype.name).toLowerCase() === "html";
        var lang = (D.documentElement.getAttribute("lang") || "").toLowerCase();
        var wantLang = (test.lang || "").toLowerCase();
        var langOk = wantLang === "" ? lang.length > 0 : lang.indexOf(wantLang) === 0;
        return {
          passed: hasDoctype && langOk,
          message: (hasDoctype ? "Deklaracja <!DOCTYPE html> jest. " : "Brak deklaracji <!DOCTYPE html>. ") +
            (langOk ? "Atrybut lang: „" + lang + "”." : "Atrybut lang: oczekiwano „" + (wantLang || "dowolny") + "”, znaleziono „" + (lang || "brak") + "”.")
        };
      }
      case "interaction": {
        for (var i = 0; i < test.steps.length; i++) {
          var step = test.steps[i];
          if (step.action === "wait") { await sleep(step.ms); continue; }
          var target = one(step.selector);
          if (!target) return { passed: false, message: "Krok " + (i + 1) + ": nie znaleziono „" + step.selector + "”." };
          if (step.action === "click") target.click();
          else setValue(target, step.value);
          await sleep(30);
        }
        await sleep(60);
        return checkExpect(test.expect);
      }
      default:
        return { passed: false, message: "Nieobsługiwany typ testu: " + test.type };
    }
  }

  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || data.source !== "inf03-runner" || data.type !== "run-test") return;
    var test = data.test;
    Promise.resolve()
      .then(function () { return runTest(test); })
      .catch(function (e) { return { passed: false, message: "Błąd podczas sprawdzania: " + (e && e.message ? e.message : e) }; })
      .then(function (result) {
        parent.postMessage({
          source: "inf03-preview",
          frameId: data.frameId,
          type: "test-result",
          payload: { id: test.id, passed: !!result.passed, message: String(result.message || "") }
        }, "*");
      });
  });
})();
`;
