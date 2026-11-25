// Aqar visual identity: architect's blueprint, a house that draws itself, drifting clouds, for-sale signs, map pins.
export const theme = {
  badge: (k, s) => `<span class="ap" style="width:${s * .85}px;height:${s}px"><svg viewBox="0 0 34 40" aria-hidden="true"><path class="app" d="M17 2a13 13 0 0113 13c0 9-13 23-13 23S4 24 4 15A13 13 0 0117 2z"/><path class="api" d="M10.5 16L17 10l6.5 6v6h-13z"/></svg></span>`,
  empty: () => `<svg class="ae" viewBox="0 0 180 130" width="190" aria-hidden="true"><path class="ap1" d="M30 124V12h70"/><path class="ap2" d="M30 124h-14M30 124h30"/><g class="asign"><path class="ap3" d="M52 12v14M92 12v14"/><rect x="40" y="26" width="64" height="36" rx="6" class="ap4"/><text x="72" y="50" text-anchor="middle" class="atx">للبيع</text></g><path class="ap5" d="M120 124v-32l22-18 22 18v32z"/><rect x="134" y="104" width="16" height="20" class="ap6"/></svg>`,
};
export const blueprintHero = () => `<div class="bp" aria-hidden="true"><svg viewBox="0 0 420 180" width="100%" height="180" preserveAspectRatio="xMidYMid meet">
<circle class="sun" cx="60" cy="60" r="16"/><g class="cloud c1"><ellipse cx="0" cy="0" rx="26" ry="9"/><ellipse cx="16" cy="-6" rx="14" ry="8"/></g><g class="cloud c2"><ellipse cx="0" cy="0" rx="20" ry="7"/><ellipse cx="-10" cy="-5" rx="11" ry="6"/></g>
<path class="hline" pathLength="1" d="M130 160V86l80-58 80 58v74zM130 160h160M190 160v-44h40v44M150 100h28v26h-28zM242 100h28v26h-28z"/>
<path class="dim" d="M130 172h160M130 168v8M290 168v8"/><text x="210" y="168" text-anchor="middle" class="dt">12 m</text>
<path class="dim" d="M312 160V28M308 28h8M308 160h8"/><text x="326" y="98" class="dt">9 m</text></svg></div>`;
