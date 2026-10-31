import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const start = source.indexOf('const CSS = ')
const open = source.indexOf('`', start)
const close = source.indexOf('`', open + 1)
const css = source.slice(open + 1, close)

let failures = 0
const check = (label, actual, expected) => {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    console.log(`ok   ${label}`)
    return
  }
  failures += 1
  console.log(`FAIL ${label}\n  expected ${e}\n  actual   ${a}`)
}

const count = (re) => (css.match(re) ?? []).length

check('braces are balanced', count(/\{/g), count(/\}/g))
check('parens are balanced', count(/\(/g), count(/\)/g))

// Every colour must come from a theme token. A literal is allowed only inside a
// `color-mix(...)` shade (a shadow, or darkening the brand for a hover), never as
// a standalone surface or text colour.
const withoutMixes = css.replace(/color-mix\((?:[^()]|\([^()]*\))*\)/g, '')
const literals = [...withoutMixes.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => match[0])
check('no literal hex colour outside a mix', literals, [])

// Every class the components reference must exist in the sheet.
const styled = new Set([...css.matchAll(/\.(dshsb-[a-z0-9-]+)/g)].map((match) => match[1]))
const referenced = new Set([...source.matchAll(/dshsb-[a-z0-9-]+/g)].map((match) => match[0]))
const unstyled = [...referenced].filter((name) => !styled.has(name))
console.log(`classes styled ${styled.size}, referenced ${referenced.size}`)
// Animation names and custom properties are referenced, not styled.
const notClasses = /^(dshsb-(spin|fade|pop|toastin|pulse|ease|hair|hair-soft|sheen|mono))$/
check('every referenced class is styled', unstyled.filter((name) => !notClasses.test(name)), [])

// A button must never be able to clip its own label. `min-width:0` disables the
// flex automatic minimum size and `overflow:hidden` then cuts the text: that is
// exactly what squeezed the commit button.
const buttonRule = css.match(/\.dshsb-btn\{[^}]*\}/)?.[0] ?? ''
check('button keeps its automatic minimum width', /min-width:\s*0/.test(buttonRule), false)
check('button never clips its label', /overflow:\s*hidden/.test(buttonRule), false)

// The commit input shares the `.dshsb-field` skin, so a later `.dshsb-field` rule
// silently wins over an earlier per-use rule. Resolve the effective height the
// way the cascade does — last matching declaration wins — instead of trusting
// the file's layout.
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((match) => ({ selector: match[1].trim(), body: match[2] }))
  .filter((rule) => /^\.[a-z0-9-]+$/i.test(rule.selector))

const effectiveHeight = (classList) => {
  let height = null
  for (const rule of rules) {
    if (!classList.includes(rule.selector.slice(1))) continue
    const declared = rule.body.match(/(?:^|;)\s*height\s*:\s*([\d.]+)px/)
    if (declared) height = Number(declared[1])
  }
  return height
}

const inputHeight = effectiveHeight(['dshsb-field', 'dshsb-commit-input'])
const buttonHeight = effectiveHeight(['dshsb-btn', 'dshsb-commit-btn'])
console.log(`commit row heights: input ${inputHeight}px, button ${buttonHeight}px`)
check('commit input is at least as tall as the commit button', inputHeight >= buttonHeight, true)

// A percentage basis grows with the column, which is what makes the commit
// button follow the panel — but it must stop growing at a sane ceiling.
const commitButtonRule = css.match(/\.dshsb-commit-btn\{[^}]*\}/)?.[0] ?? ''
const proportional = /flex:\s*0\s+0\s+[\d.]+%/.test(commitButtonRule)
check('proportional commit button declares a pixel ceiling', proportional && /max-width:\s*\d+px/.test(commitButtonRule), true)

console.log(failures === 0 ? '\nall style checks passed' : `\n${failures} check(s) failed`)
process.exitCode = failures === 0 ? 0 : 1
