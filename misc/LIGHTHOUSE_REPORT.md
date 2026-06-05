# Lighthouse Audit Report

> Extracted from `misc/NOTES.md` (PageSpeed Insights / Lighthouse v13.3.0 output).
> Source page: **https://onth0s.github.io/markdown-viewer/**
> Captured: **Jun 5, 2026, 11:02 PM GMT+2** (single page session).
> Tool: **Lighthouse 13.3.0** on **HeadlessChromium 146.0.7680.177** from **Europe**.

## 1. Executive Summary

| Profile | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile  (Moto G Power)   | **47** / 100 | **84** / 100 | **96** / 100 | **100** / 100 |
| Desktop (no throttling)  | **82** / 100 | **88** / 100 | **96** / 100 | **100** / 100 |

**Throttling applied**

- **Mobile**: 1.2x CPU slowdown (simulated) - 412x823 viewport @ DPR 1.75 - Slow 4G (150 ms RTT, 1,638.4 kb/s).
- **Desktop**: 1x CPU (no slowdown) - 1350x940 viewport @ DPR 1 - no network throttling.

## 2. Mobile Profile

### 2.1 Environment

- Captured at Jun 5, 2026, 11:02 PM GMT+2
- Emulated Moto G Power with Lighthouse 13.3.0
- Single page session
- Initial page load
- Slow 4G throttling
- Using HeadlessChromium 146.0.7680.177 with lr

### 2.2 Performance metrics

| Metric | Value | What it measures |
|---|---|---|
| First Contentful Paint | **3.1 s** | Time at which the first text or image is painted. |
| Largest Contentful Paint | **9.5 s** | Time at which the largest text or image is painted. |
| Total Blocking Time | **940 ms** | Sum of FCP -> TTI intervals with tasks >50 ms. |
| Cumulative Layout Shift | **0.044** | Movement of visible elements within the viewport. |
| Speed Index | **3.5 s** | How quickly the contents of a page are visibly populated. |

### 2.3 Audit findings

#### Insights (9 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| OPPORTUNITY | `render-blocking-insight`<br/>Render-blocking requests | Requests are blocking the page's initial render, which may delay LCP. Deferring or inlining can move these network requests out of the critical path. | Est savings of 2,390 ms |
| OPPORTUNITY | `cache-insight`<br/>Use efficient cache lifetimes | A long cache lifetime can speed up repeat visits to your page. Learn more about caching . | Est savings of 433 KiB |
| OPPORTUNITY | `legacy-javascript-insight`<br/>Legacy JavaScript | Polyfills and transforms enable older browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying your JavaScript build process to not transpile Baseline features, u... | Est savings of 23 KiB |
| METRIC | `forced-reflow-insight`<br/>Forced reflow | A forced reflow occurs when JavaScript queries geometric properties (such as offsetWidth) after styles have been invalidated by a change to the DOM state. This can result in poor performance. Learn more about forced r... | _- |
| METRIC | `network-dependency-tree-insight`<br/>Network dependency tree | Avoid chaining critical requests by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load. | _- |
| OPPORTUNITY | `viewport-insight`<br/>Optimize viewport for mobile | Tap interactions may be delayed by up to 300 ms if the viewport is not optimized for mobile. | _- |
| INFO | `cls-culprits-insight`<br/>Layout shift culprits | Layout shifts occur when elements move absent any user interaction. Investigate the causes of layout shifts , such as elements being added, removed, or their fonts changing as the page loads. | 0.044 |
| INFO | `lcp-breakdown-insight`<br/>LCP breakdown | Each subpart has specific improvement strategies . Ideally, most of the LCP time should be spent on loading the resources, not within delays. | _- |
| INFO | `third-parties-insight`<br/>3rd parties | 3rd party code can significantly impact load performance. Reduce and defer loading of 3rd party code to prioritize your page's content. | _- |

#### Diagnostics (3 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| OPPORTUNITY | `bootup-time`<br/>Reduce JavaScript execution time | Consider reducing the time spent parsing, compiling, and executing JS. You may find delivering smaller JS payloads helps with this. Learn how to reduce Javascript execution time . | 1.3 s |
| OPPORTUNITY | `unused-javascript`<br/>Reduce unused JavaScript | Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. Learn how to reduce unused JavaScript . | Est savings of 866 KiB |
| INFO | `long-tasks`<br/>Avoid long main-thread tasks | Lists the longest tasks on the main thread, useful for identifying worst contributors to input delay. Learn how to avoid long main-thread tasks | 4 long tasks found |

#### Passed audits (15 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| OPPORTUNITY | `document-latency-insight`<br/>Document request latency | Your first network request is the most important. Reduce its latency by avoiding redirects, ensuring a fast server response, and enabling text compression. | _- |
| METRIC | `dom-size-insight`<br/>Optimize DOM size | A large DOM can increase the duration of style calculations and layout reflows, impacting page responsiveness. A large DOM will also increase memory usage. Learn how to avoid an excessive DOM size . | 851 |
| OPPORTUNITY | `duplicated-javascript-insight`<br/>Duplicated JavaScript | Remove large, duplicate JavaScript modules from bundles to reduce unnecessary bytes consumed by network activity. | _- |
| OPPORTUNITY | `font-display-insight`<br/>Font display | Consider setting font-display to swap or optional to ensure text is consistently visible. swap can be further optimized to mitigate layout shifts with font metric overrides . | _- |
| OPPORTUNITY | `image-delivery-insight`<br/>Improve image delivery | Reducing the download time of images can improve the perceived load time of the page and LCP. Learn more about optimizing image size | _- |
| N/A | `inp-breakdown-insight`<br/>INP breakdown | Start investigating how to improve INP by looking at the longest subpart. | _- |
| N/A | `lcp-discovery-insight`<br/>LCP request discovery | Optimize LCP by making the LCP image discoverable from the HTML immediately, and avoiding lazy-loading | _- |
| OPPORTUNITY | `unminified-css`<br/>Minify CSS | Minifying CSS files can reduce network payload sizes. Learn how to minify CSS . | _- |
| OPPORTUNITY | `unminified-javascript`<br/>Minify JavaScript | Minifying JavaScript files can reduce payload sizes and script parse time. Learn how to minify JavaScript . | _- |
| OPPORTUNITY | `unused-css-rules`<br/>Reduce unused CSS | Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. Learn how to reduce unused CSS . | _- |
| OPPORTUNITY | `total-byte-weight`<br/>Avoids enormous network payloads | Large network payloads cost users real money and are highly correlated with long load times. Learn how to reduce payload sizes . | Total size was 1,457 KiB |
| N/A | `user-timings`<br/>User Timing marks and measures | Consider instrumenting your app with the User Timing API to measure your app's real-world performance during key user experiences. Learn more about User Timing marks . | _- |
| OPPORTUNITY | `mainthread-work-breakdown`<br/>Minimizes main-thread work | Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. Learn how to minimize main-thread work | 1.8 s |
| N/A | `non-composited-animations`<br/>Avoid non-composited animations | Animations which are not composited can be janky and increase CLS. Learn how to avoid non-composited animations | _- |
| OPPORTUNITY | `unsized-images`<br/>unsized-images | Set an explicit width and height on image elements to reduce layout shifts and improve CLS. Learn how to set image dimensions | _- |

#### Names and labels (2 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `label`<br/>Form elements do not have associated labels | _(no description)_ | _- |
| CHECK | `link-name`<br/>Links do not have a discernible name | _(no description)_ | _- |

#### Contrast (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `color-contrast`<br/>Background and foreground colors do not have a sufficient contrast ratio. | _(no description)_ | _- |

#### Best practices (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `landmark-one-main`<br/>Document does not have a main landmark. | _(no description)_ | _- |

#### Additional items to manually check (10 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| MANUAL | `focusable-controls`<br/>Interactive controls are keyboard focusable | Custom interactive controls are keyboard focusable and display a focus indicator. Learn how to make custom controls focusable . | _- |
| MANUAL | `interactive-element-affordance`<br/>Interactive elements indicate their purpose and state | Interactive elements, such as links and buttons, should indicate their state and be distinguishable from non-interactive elements. Learn how to decorate interactive elements with affordance hints . | _- |
| MANUAL | `logical-tab-order`<br/>The page has a logical tab order | Tabbing through the page follows the visual layout. Users cannot focus elements that are offscreen. Learn more about logical tab ordering . | _- |
| MANUAL | `visual-order-follows-dom`<br/>Visual order on the page follows DOM order | DOM order matches the visual order, improving navigation for assistive technology. Learn more about DOM and visual ordering . | _- |
| MANUAL | `focus-traps`<br/>User focus is not accidentally trapped in a region | A user can tab into and out of any control or region without accidentally trapping their focus. Learn how to avoid focus traps . | _- |
| MANUAL | `managed-focus`<br/>The user's focus is directed to new content added to the page | If new content, such as a dialog, is added to the page, the user's focus is directed to it. Learn how to direct focus to new content . | _- |
| MANUAL | `use-landmarks`<br/>HTML5 landmark elements are used to improve navigation | Landmark elements ( &lt;main&gt; , &lt;nav&gt; , etc.) are used to improve the keyboard navigation of the page for assistive technology. Learn more about landmark elements . | _- |
| MANUAL | `offscreen-content-hidden`<br/>Offscreen content is hidden from assistive technology | Offscreen content is hidden with display: none or aria-hidden=true. Learn how to properly hide offscreen content . | _- |
| MANUAL | `custom-controls-labels`<br/>Custom controls have associated labels | Custom interactive controls have associated labels, provided by aria-label or aria-labelledby. Learn more about custom controls and labels . | _- |
| MANUAL | `custom-controls-roles`<br/>Custom controls have ARIA roles | Custom interactive controls have appropriate ARIA roles. Learn how to add roles to custom controls . | _- |

#### Passed audits (19 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `aria-allowed-attr`<br/>aria-allowed-attr | _(no description)_ | _- |
| CHECK | `aria-hidden-body`<br/>aria-hidden-body | _(no description)_ | _- |
| CHECK | `aria-required-attr`<br/>aria-required-attr | _(no description)_ | _- |
| CHECK | `aria-roles`<br/>aria-roles | _(no description)_ | _- |
| CHECK | `aria-valid-attr-value`<br/>aria-valid-attr-value | _(no description)_ | _- |
| CHECK | `aria-valid-attr`<br/>aria-valid-attr | _(no description)_ | _- |
| CHECK | `image-alt`<br/>image-alt | _(no description)_ | _- |
| CHECK | `aria-conditional-attr`<br/>ARIA attributes are used as specified for the element's role | _(no description)_ | _- |
| CHECK | `aria-prohibited-attr`<br/>Elements use only permitted ARIA attributes | _(no description)_ | _- |
| CHECK | `document-title`<br/>document-title | _(no description)_ | _- |
| CHECK | `html-has-lang`<br/>html-has-lang | _(no description)_ | _- |
| CHECK | `html-lang-valid`<br/>html-lang-valid | _(no description)_ | _- |
| CHECK | `list`<br/>list | _(no description)_ | _- |
| CHECK | `listitem`<br/>listitem | _(no description)_ | _- |
| CHECK | `tabindex`<br/>tabindex | _(no description)_ | _- |
| CHECK | `target-size`<br/>Touch targets have sufficient size and spacing. | _(no description)_ | _- |
| CHECK | `td-headers-attr`<br/>td-headers-attr | _(no description)_ | _- |
| CHECK | `heading-order`<br/>Heading elements appear in a sequentially-descending order | _(no description)_ | _- |
| CHECK | `aria-deprecated-role`<br/>Deprecated ARIA roles were not used | _(no description)_ | _- |

#### Not applicable (40 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| N/A | `accesskeys`<br/>accesskeys | Access keys let users quickly focus a part of the page. For proper navigation, each access key must be unique. Learn more about access keys . | _- |
| N/A | `aria-command-name`<br/>aria-command-name | When an element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to make command elements more accessible . | _- |
| N/A | `aria-dialog-name`<br/>aria-dialog-name | ARIA dialog elements without accessible names may prevent screen readers users from discerning the purpose of these elements. Learn how to make ARIA dialog elements more accessible . | _- |
| N/A | `aria-hidden-focus`<br/>aria-hidden-focus | Focusable descendents within an [aria-hidden="true"] element prevent those interactive elements from being available to users of assistive technologies like screen readers. Learn how aria-hidden affects focusable elem... | _- |
| N/A | `aria-input-field-name`<br/>ARIA input fields have accessible names | When an input field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn more about input field labels . | _- |
| N/A | `aria-meter-name`<br/>aria-meter-name | When a meter element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to name meter elements . | _- |
| N/A | `aria-progressbar-name`<br/>aria-progressbar-name | When a progressbar element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to label progressbar elements . | _- |
| N/A | `aria-required-children`<br/>aria-required-children | Some ARIA parent roles must contain specific child roles to perform their intended accessibility functions. Learn more about roles and required children elements . | _- |
| N/A | `aria-required-parent`<br/>aria-required-parent | Some ARIA child roles must be contained by specific parent roles to properly perform their intended accessibility functions. Learn more about ARIA roles and required parent element . | _- |
| N/A | `aria-text`<br/>aria-text | Adding role=text around a text node split by markup enables VoiceOver to treat it as one phrase, but the element's focusable descendents will not be announced. Learn more about the role=text attribute . | _- |
| N/A | `aria-toggle-field-name`<br/>ARIA toggle fields have accessible names | When a toggle field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn more about toggle fields . | _- |
| N/A | `aria-tooltip-name`<br/>aria-tooltip-name | When a tooltip element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to name tooltip elements . | _- |
| N/A | `aria-treeitem-name`<br/>aria-treeitem-name | When a treeitem element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn more about labeling treeitem elements . | _- |
| N/A | `button-name`<br/>Buttons have an accessible name | When a button doesn't have an accessible name, screen readers announce it as "button", making it unusable for users who rely on screen readers. Learn how to make buttons more accessible . | _- |
| N/A | `bypass`<br/>The page contains a heading, skip link, or landmark region | Adding ways to bypass repetitive content lets keyboard users navigate the page more efficiently. Learn more about bypass blocks . | _- |
| N/A | `definition-list`<br/>definition-list | When definition lists are not properly marked up, screen readers may produce confusing or inaccurate output. Learn how to structure definition lists correctly . | _- |
| N/A | `dlitem`<br/>dlitem | Definition list items ( &lt;dt&gt; and &lt;dd&gt; ) must be wrapped in a parent &lt;dl&gt; element to ensure that screen readers can properly announce them. Learn how to structure definition lists correctly . | _- |
| N/A | `duplicate-id-aria`<br/>ARIA IDs are unique | The value of an ARIA ID must be unique to prevent other instances from being overlooked by assistive technologies. Learn how to fix duplicate ARIA IDs . | _- |
| N/A | `form-field-multiple-labels`<br/>No form fields have multiple labels | Form fields with multiple labels can be confusingly announced by assistive technologies like screen readers which use either the first, the last, or all of the labels. Learn how to use form labels . | _- |
| N/A | `frame-title`<br/>frame-title | Screen reader users rely on frame titles to describe the contents of frames. Learn more about frame titles . | _- |
| N/A | `html-xml-lang-mismatch`<br/>html-xml-lang-mismatch | If the webpage does not specify a consistent language, then the screen reader might not announce the page's text correctly. Learn more about the lang attribute . | _- |
| N/A | `input-button-name`<br/>Input buttons have discernible text. | Adding discernable and accessible text to input buttons may help screen reader users understand the purpose of the input button. Learn more about input buttons . | _- |
| N/A | `input-image-alt`<br/>input-image-alt | When an image is being used as an &lt;input&gt; button, providing alternative text can help screen reader users understand the purpose of the button. Learn about input image alt text . | _- |
| N/A | `link-in-text-block`<br/>Links are distinguishable without relying on color. | Low-contrast text is difficult or impossible for many users to read. Link text that is discernible improves the experience for users with low vision. Learn how to make links distinguishable . | _- |
| N/A | `meta-refresh`<br/>meta-refresh | Users do not expect a page to refresh automatically, and doing so will move focus back to the top of the page. This may create a frustrating or confusing experience. Learn more about the refresh meta tag . | _- |
| N/A | `meta-viewport`<br/>meta-viewport | Disabling zooming is problematic for users with low vision who rely on screen magnification to properly see the contents of a web page. Learn more about the viewport meta tag . | _- |
| N/A | `object-alt`<br/>object-alt | Screen readers cannot translate non-text content. Adding alternate text to &lt;object&gt; elements helps screen readers convey meaning to users. Learn more about alt text for object elements . | _- |
| N/A | `select-name`<br/>Select elements have associated label elements. | Form elements without effective labels can create frustrating experiences for screen reader users. Learn more about the select element . | _- |
| N/A | `skip-link`<br/>Skip links are focusable. | Including a skip link can help users skip to the main content to save time. Learn more about skip links . | _- |
| N/A | `th-has-data-cells`<br/>th-has-data-cells | Screen readers have features to make navigating tables easier. Ensuring table headers always refer to some set of cells may improve the experience for screen reader users. Learn more about table headers . | _- |
| N/A | `valid-lang`<br/>valid-lang | Specifying a valid BCP 47 language on elements helps ensure that text is pronounced correctly by a screen reader. Learn how to use the lang attribute . | _- |
| N/A | `video-caption`<br/>video-caption | When a video provides a caption it is easier for deaf and hearing impaired users to access its information. Learn more about video captions . | _- |
| N/A | `autocomplete-valid`<br/>autocomplete-valid | The autocomplete attribute values must be valid and correctly applied for screen readers to function correctly. Learn more about valid autocomplete values . | _- |
| N/A | `presentation-role-conflict`<br/>presentation-role-conflict | There are certain cases where the semantic role of an element with role="none" or role="presentation" does not resolve to none or presentation. To ensure the element remains removed from the accessibility tree, you sh... | _- |
| N/A | `svg-img-alt`<br/>svg-img-alt | Ensures SVG elements with an img , graphics-document or graphics-symbol role have an accessible text alternative. Learn more about SVG alt text . | _- |
| N/A | `table-duplicate-name`<br/>table-duplicate-name | The summary attribute should describe the table structure, while &lt;caption&gt; should have the onscreen title. Accurate table mark-up helps users of screen readers. Learn more about summary and caption . | _- |
| N/A | `empty-heading`<br/>All heading elements contain content. | A heading with no content or inaccessible text prevent screen reader users from accessing information on the page's structure. Learn more about headings . | _- |
| N/A | `aria-allowed-role`<br/>Uses ARIA roles only on compatible elements | Many HTML elements can only be assigned certain ARIA roles. Using ARIA roles where they are not allowed can interfere with the accessibility of the web page. Learn more about ARIA roles . | _- |
| N/A | `image-redundant-alt`<br/>image-redundant-alt | Informative elements should aim for short, descriptive alternative text. Alternative text that is exactly the same as the text adjacent to the link or image is potentially confusing for screen reader users, because th... | _- |
| N/A | `identical-links-same-purpose`<br/>Identical links have the same purpose. | Links with the same destination should have the same description, to help users understand the link's purpose and decide whether to follow it. Learn more about identical links . | _- |

#### General (2 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `errors-in-console`<br/>Browser errors were logged to the console | Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. Learn more about this errors in console diagnostic audit Show 3rd-party resources ( 1 ... | _- |
| INFO | `js-libraries`<br/>Detected JavaScript libraries | All front-end JavaScript libraries detected on the page. Learn more about this JavaScript library detection diagnostic audit . | _- |

#### Trust and Safety (5 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| INFO | `csp-xss`<br/>Ensure CSP is effective against XSS attacks | A strong Content Security Policy (CSP) significantly reduces the risk of cross-site scripting (XSS) attacks. Learn how to use a CSP to prevent XSS | _- |
| INFO | `has-hsts`<br/>Use a strong HSTS policy | Deployment of the HSTS header significantly reduces the risk of downgrading HTTP connections and eavesdropping attacks. A rollout in stages, starting with a low max-age is recommended. Learn more about using a strong ... | _- |
| INFO | `origin-isolation`<br/>Ensure proper origin isolation with COOP | The Cross-Origin-Opener-Policy (COOP) can be used to isolate the top-level window from other documents such as pop-ups. Learn more about deploying the COOP header. | _- |
| INFO | `clickjacking-mitigation`<br/>Mitigate clickjacking with XFO or CSP | The X-Frame-Options (XFO) header or the frame-ancestors directive in the Content-Security-Policy (CSP) header control where a page can be embedded. These can mitigate clickjacking attacks by blocking some or all sites... | _- |
| INFO | `trusted-types-xss`<br/>Mitigate DOM-based XSS with Trusted Types | The require-trusted-types-for directive in the Content-Security-Policy (CSP) header instructs user agents to control the data passed to DOM XSS sink functions. Learn more about mitigating DOM-based XSS with Trusted Ty... | _- |

#### Browser Compatibility (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| INFO | `baseline`<br/>Baseline Features | Lists web features used on the page and their Baseline status as of 2026-05-01. Learn more about Baseline . | _- |

#### Passed audits (12 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `is-on-https`<br/>Uses HTTPS | _(no description)_ | _- |
| CHECK | `deprecations`<br/>Avoids deprecated APIs | _(no description)_ | _- |
| CHECK | `third-party-cookies`<br/>Avoids third-party cookies | _(no description)_ | _- |
| CHECK | `paste-preventing-inputs`<br/>Allows users to paste into input fields | _(no description)_ | _- |
| CHECK | `geolocation-on-start`<br/>Avoids requesting the geolocation permission on page load | _(no description)_ | _- |
| CHECK | `notification-on-start`<br/>Avoids requesting the notification permission on page load | _(no description)_ | _- |
| CHECK | `image-aspect-ratio`<br/>Displays images with correct aspect ratio | _(no description)_ | _- |
| CHECK | `image-size-responsive`<br/>Serves images with appropriate resolution | _(no description)_ | _- |
| CHECK | `doctype`<br/>Page has the HTML doctype | _(no description)_ | _- |
| CHECK | `charset`<br/>Properly defines charset | _(no description)_ | _- |
| CHECK | `inspector-issues`<br/>inspector-issues | _(no description)_ | _- |
| CHECK | `valid-source-maps`<br/>Page has valid source maps | Source maps translate minified code to the original source code. This helps developers debug in production. In addition, Lighthouse is able to provide further insights. Consider deploying source maps to take advantage... | _- |

#### Not applicable (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| N/A | `redirects-http`<br/>Redirects HTTP traffic to HTTPS | Make sure that you redirect all HTTP traffic to HTTPS in order to enable secure web features for all your users. Learn more . | _- |

#### Additional items to manually check (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| MANUAL | `structured-data`<br/>Structured data is valid | Run the Structured Data Testing Tool to validate structured data. Learn more about Structured Data . | _- |

#### Passed audits (8 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `is-crawlable`<br/>Page isn’t blocked from indexing | _(no description)_ | _- |
| CHECK | `document-title`<br/>document-title | _(no description)_ | _- |
| CHECK | `meta-description`<br/>Document has a meta description | _(no description)_ | _- |
| CHECK | `http-status-code`<br/>Page has successful HTTP status code | _(no description)_ | _- |
| CHECK | `link-text`<br/>Links have descriptive text | _(no description)_ | _- |
| CHECK | `crawlable-anchors`<br/>Links are crawlable | _(no description)_ | _- |
| CHECK | `image-alt`<br/>image-alt | _(no description)_ | _- |
| CHECK | `hreflang`<br/>hreflang | _(no description)_ | _- |

#### Not applicable (2 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| N/A | `robots-txt`<br/>robots.txt is valid | If your robots.txt file is malformed, crawlers may not be able to understand how you want your website to be crawled or indexed. Learn more about robots.txt . | _- |
| N/A | `canonical`<br/>canonical | Canonical links suggest which URL to show in search results. Learn more about canonical links . | _- |

### 2.4 Third-party resources (0 entities)

| Entity | Total size | Total duration |
|---|---|---|
| JSDelivr CDN | 855.0 KiB | 0 ms |
| Cloudflare CDN | 196.2 KiB | 750 ms |
| GitHub | 13.9 KiB | 2,410 ms |
| GitHub | 378 KiB | (onth0s.github.io) |
| JSDelivr CDN | 855 KiB | (cdn.jsdelivr.net) |
| Cloudflare CDN | 2 KiB | (cdnjs.cloudflare.com) |

### 2.5 Critical request chain

**Maximum critical path latency: 901 ms** (44 nodes)

| URL | Duration | Size |
|---|---|---|
| `https://onth0s.github.io/markdown-viewer/` | 38 ms | 12.40 KiB |
| `https://onth0s.github.io/markdown-viewer/css/github-markdown-dark_dimmed.css` | 51 ms | 5.80 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css` | 57 ms | 1.42 KiB |
| `https://onth0s.github.io/markdown-viewer/css/style.css` | 49 ms | 0.87 KiB |
| `https://onth0s.github.io/markdown-viewer/css/variables.css` | 62 ms | 2.50 KiB |
| `https://onth0s.github.io/markdown-viewer/monaco.ttf` | 132 ms | 39.56 KiB |
| `https://onth0s.github.io/markdown-viewer/Roboto.ttf` | 148 ms | 275.45 KiB |
| `https://onth0s.github.io/markdown-viewer/css/reset.css` | 64 ms | 1.10 KiB |
| `https://onth0s.github.io/markdown-viewer/css/layout.css` | 95 ms | 1.23 KiB |
| `https://onth0s.github.io/markdown-viewer/css/header.css` | 67 ms | 2.28 KiB |
| `https://onth0s.github.io/markdown-viewer/css/editor.css` | 60 ms | 1.55 KiB |
| `https://onth0s.github.io/markdown-viewer/css/preview.css` | 63 ms | 2.26 KiB |
| `https://onth0s.github.io/markdown-viewer/css/scrollbars.css` | 66 ms | 2.11 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4.0/purify.min.js` | 70 ms | 1.01 KiB |
| `https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js` | 53 ms | 14.48 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js` | 58 ms | 3.73 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js` | 55 ms | 3.13 KiB |
| `https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js` | 143 ms | 840.53 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js` | 81 ms | 188.37 KiB |
| `https://onth0s.github.io/markdown-viewer/js/main.js` | 52 ms | 2.69 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/constants.js` | 862 ms | 1.33 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/storage.js` | 849 ms | 1.32 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/ui-divider.js` | 850 ms | 1.66 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/scroll-utils.js` | 851 ms | 1.83 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/logo-engine.js` | 852 ms | 1.39 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/scroll-sync.js` | 857 ms | 1.66 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/theme-controller.js` | 863 ms | 1.98 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/settings-panel.js` | 854 ms | 2.05 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/color-engine.js` | 870 ms | 1.24 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/theme-engine.js` | 872 ms | 2.86 KiB |
| `https://onth0s.github.io/markdown-viewer/js/editor/editor-controller.js` | 855 ms | 1.44 KiB |
| `https://onth0s.github.io/markdown-viewer/js/editor/highlighter.js` | 871 ms | 1.84 KiB |
| `https://onth0s.github.io/markdown-viewer/js/editor/scrollbars.js` | 873 ms | 1.70 KiB |
| `https://onth0s.github.io/markdown-viewer/DEFAULT.md` | 901 ms | 2.64 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/mermaid-renderer.js` | 854 ms | 1.66 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/utils.js` | 872 ms | 0.99 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/markdown-renderer.js` | 856 ms | 2.41 KiB |
| `https://onth0s.github.io/markdown-viewer/js/selection/source-mapper.js` | 873 ms | 1.87 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/scrollbars.js` | 858 ms | 1.57 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/hscrollbar.js` | 861 ms | 2.37 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/actions.js` | 853 ms | 2.30 KiB |
| `https://onth0s.github.io/markdown-viewer/js/selection/selection-engine.js` | 860 ms | 1.30 KiB |
| `https://onth0s.github.io/markdown-viewer/js/selection/dom-highlighter.js` | 874 ms | 2.47 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/emoji-helper.js` | 859 ms | 1.55 KiB |

## 2. Desktop Profile

### 2.1 Environment

- Captured at Jun 5, 2026, 11:02 PM GMT+2
- Emulated Desktop with Lighthouse 13.3.0
- Single page session
- Initial page load
- Custom throttling
- Using HeadlessChromium 146.0.7680.177 with lr

### 2.2 Performance metrics

| Metric | Value | What it measures |
|---|---|---|
| First Contentful Paint | **1.3 s** | Time at which the first text or image is painted. |
| Largest Contentful Paint | **1.8 s** | Time at which the largest text or image is painted. |
| Total Blocking Time | **200 ms** | Sum of FCP -> TTI intervals with tasks >50 ms. |
| Cumulative Layout Shift | **0.003** | Movement of visible elements within the viewport. |
| Speed Index | **1.3 s** | How quickly the contents of a page are visibly populated. |

### 2.3 Audit findings

#### Insights (8 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| OPPORTUNITY | `render-blocking-insight`<br/>Render-blocking requests | Requests are blocking the page's initial render, which may delay LCP. Deferring or inlining can move these network requests out of the critical path. | Est savings of 1,120 ms |
| OPPORTUNITY | `cache-insight`<br/>Use efficient cache lifetimes | A long cache lifetime can speed up repeat visits to your page. Learn more about caching . | Est savings of 434 KiB |
| OPPORTUNITY | `legacy-javascript-insight`<br/>Legacy JavaScript | Polyfills and transforms enable older browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying your JavaScript build process to not transpile Baseline features, u... | Est savings of 23 KiB |
| METRIC | `forced-reflow-insight`<br/>Forced reflow | A forced reflow occurs when JavaScript queries geometric properties (such as offsetWidth) after styles have been invalidated by a change to the DOM state. This can result in poor performance. Learn more about forced r... | _- |
| METRIC | `network-dependency-tree-insight`<br/>Network dependency tree | Avoid chaining critical requests by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load. | _- |
| INFO | `cls-culprits-insight`<br/>Layout shift culprits | Layout shifts occur when elements move absent any user interaction. Investigate the causes of layout shifts , such as elements being added, removed, or their fonts changing as the page loads. | 0.003 |
| INFO | `lcp-breakdown-insight`<br/>LCP breakdown | Each subpart has specific improvement strategies . Ideally, most of the LCP time should be spent on loading the resources, not within delays. | _- |
| INFO | `third-parties-insight`<br/>3rd parties | 3rd party code can significantly impact load performance. Reduce and defer loading of 3rd party code to prioritize your page's content. | _- |

#### Diagnostics (2 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| OPPORTUNITY | `unused-javascript`<br/>Reduce unused JavaScript | Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. Learn how to reduce unused JavaScript . | Est savings of 866 KiB |
| INFO | `long-tasks`<br/>Avoid long main-thread tasks | Lists the longest tasks on the main thread, useful for identifying worst contributors to input delay. Learn how to avoid long main-thread tasks | 4 long tasks found |

#### Passed audits (17 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| OPPORTUNITY | `document-latency-insight`<br/>Document request latency | Your first network request is the most important. Reduce its latency by avoiding redirects, ensuring a fast server response, and enabling text compression. | _- |
| METRIC | `dom-size-insight`<br/>Optimize DOM size | A large DOM can increase the duration of style calculations and layout reflows, impacting page responsiveness. A large DOM will also increase memory usage. Learn how to avoid an excessive DOM size . | 851 |
| OPPORTUNITY | `duplicated-javascript-insight`<br/>Duplicated JavaScript | Remove large, duplicate JavaScript modules from bundles to reduce unnecessary bytes consumed by network activity. | _- |
| OPPORTUNITY | `font-display-insight`<br/>Font display | Consider setting font-display to swap or optional to ensure text is consistently visible. swap can be further optimized to mitigate layout shifts with font metric overrides . | _- |
| OPPORTUNITY | `image-delivery-insight`<br/>Improve image delivery | Reducing the download time of images can improve the perceived load time of the page and LCP. Learn more about optimizing image size | _- |
| N/A | `inp-breakdown-insight`<br/>INP breakdown | Start investigating how to improve INP by looking at the longest subpart. | _- |
| N/A | `lcp-discovery-insight`<br/>LCP request discovery | Optimize LCP by making the LCP image discoverable from the HTML immediately, and avoiding lazy-loading | _- |
| METRIC | `viewport-insight`<br/>Optimize viewport for mobile | Tap interactions may be delayed by up to 300 ms if the viewport is not optimized for mobile. | _- |
| OPPORTUNITY | `unminified-css`<br/>Minify CSS | Minifying CSS files can reduce network payload sizes. Learn how to minify CSS . | _- |
| OPPORTUNITY | `unminified-javascript`<br/>Minify JavaScript | Minifying JavaScript files can reduce payload sizes and script parse time. Learn how to minify JavaScript . | _- |
| OPPORTUNITY | `unused-css-rules`<br/>Reduce unused CSS | Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. Learn how to reduce unused CSS . | _- |
| OPPORTUNITY | `total-byte-weight`<br/>Avoids enormous network payloads | Large network payloads cost users real money and are highly correlated with long load times. Learn how to reduce payload sizes . | Total size was 1,457 KiB |
| N/A | `user-timings`<br/>User Timing marks and measures | Consider instrumenting your app with the User Timing API to measure your app's real-world performance during key user experiences. Learn more about User Timing marks . | _- |
| OPPORTUNITY | `bootup-time`<br/>JavaScript execution time | Consider reducing the time spent parsing, compiling, and executing JS. You may find delivering smaller JS payloads helps with this. Learn how to reduce Javascript execution time . | 0.5 s |
| OPPORTUNITY | `mainthread-work-breakdown`<br/>Minimizes main-thread work | Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. Learn how to minimize main-thread work | 0.7 s |
| N/A | `non-composited-animations`<br/>Avoid non-composited animations | Animations which are not composited can be janky and increase CLS. Learn how to avoid non-composited animations | _- |
| OPPORTUNITY | `unsized-images`<br/>unsized-images | Set an explicit width and height on image elements to reduce layout shifts and improve CLS. Learn how to set image dimensions | _- |

#### Names and labels (2 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `label`<br/>Form elements do not have associated labels | _(no description)_ | _- |
| CHECK | `link-name`<br/>Links do not have a discernible name | _(no description)_ | _- |

#### Best practices (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `landmark-one-main`<br/>Document does not have a main landmark. | _(no description)_ | _- |

#### Additional items to manually check (10 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| MANUAL | `focusable-controls`<br/>Interactive controls are keyboard focusable | Custom interactive controls are keyboard focusable and display a focus indicator. Learn how to make custom controls focusable . | _- |
| MANUAL | `interactive-element-affordance`<br/>Interactive elements indicate their purpose and state | Interactive elements, such as links and buttons, should indicate their state and be distinguishable from non-interactive elements. Learn how to decorate interactive elements with affordance hints . | _- |
| MANUAL | `logical-tab-order`<br/>The page has a logical tab order | Tabbing through the page follows the visual layout. Users cannot focus elements that are offscreen. Learn more about logical tab ordering . | _- |
| MANUAL | `visual-order-follows-dom`<br/>Visual order on the page follows DOM order | DOM order matches the visual order, improving navigation for assistive technology. Learn more about DOM and visual ordering . | _- |
| MANUAL | `focus-traps`<br/>User focus is not accidentally trapped in a region | A user can tab into and out of any control or region without accidentally trapping their focus. Learn how to avoid focus traps . | _- |
| MANUAL | `managed-focus`<br/>The user's focus is directed to new content added to the page | If new content, such as a dialog, is added to the page, the user's focus is directed to it. Learn how to direct focus to new content . | _- |
| MANUAL | `use-landmarks`<br/>HTML5 landmark elements are used to improve navigation | Landmark elements ( &lt;main&gt; , &lt;nav&gt; , etc.) are used to improve the keyboard navigation of the page for assistive technology. Learn more about landmark elements . | _- |
| MANUAL | `offscreen-content-hidden`<br/>Offscreen content is hidden from assistive technology | Offscreen content is hidden with display: none or aria-hidden=true. Learn how to properly hide offscreen content . | _- |
| MANUAL | `custom-controls-labels`<br/>Custom controls have associated labels | Custom interactive controls have associated labels, provided by aria-label or aria-labelledby. Learn more about custom controls and labels . | _- |
| MANUAL | `custom-controls-roles`<br/>Custom controls have ARIA roles | Custom interactive controls have appropriate ARIA roles. Learn how to add roles to custom controls . | _- |

#### Passed audits (20 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `aria-allowed-attr`<br/>aria-allowed-attr | _(no description)_ | _- |
| CHECK | `aria-hidden-body`<br/>aria-hidden-body | _(no description)_ | _- |
| CHECK | `aria-required-attr`<br/>aria-required-attr | _(no description)_ | _- |
| CHECK | `aria-roles`<br/>aria-roles | _(no description)_ | _- |
| CHECK | `aria-valid-attr-value`<br/>aria-valid-attr-value | _(no description)_ | _- |
| CHECK | `aria-valid-attr`<br/>aria-valid-attr | _(no description)_ | _- |
| CHECK | `image-alt`<br/>image-alt | _(no description)_ | _- |
| CHECK | `aria-conditional-attr`<br/>ARIA attributes are used as specified for the element's role | _(no description)_ | _- |
| CHECK | `aria-prohibited-attr`<br/>Elements use only permitted ARIA attributes | _(no description)_ | _- |
| CHECK | `color-contrast`<br/>Background and foreground colors have a sufficient contrast ratio | _(no description)_ | _- |
| CHECK | `document-title`<br/>document-title | _(no description)_ | _- |
| CHECK | `html-has-lang`<br/>html-has-lang | _(no description)_ | _- |
| CHECK | `html-lang-valid`<br/>html-lang-valid | _(no description)_ | _- |
| CHECK | `list`<br/>list | _(no description)_ | _- |
| CHECK | `listitem`<br/>listitem | _(no description)_ | _- |
| CHECK | `tabindex`<br/>tabindex | _(no description)_ | _- |
| CHECK | `target-size`<br/>Touch targets have sufficient size and spacing. | _(no description)_ | _- |
| CHECK | `td-headers-attr`<br/>td-headers-attr | _(no description)_ | _- |
| CHECK | `heading-order`<br/>Heading elements appear in a sequentially-descending order | _(no description)_ | _- |
| CHECK | `aria-deprecated-role`<br/>Deprecated ARIA roles were not used | _(no description)_ | _- |

#### Not applicable (40 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| N/A | `accesskeys`<br/>accesskeys | Access keys let users quickly focus a part of the page. For proper navigation, each access key must be unique. Learn more about access keys . | _- |
| N/A | `aria-command-name`<br/>aria-command-name | When an element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to make command elements more accessible . | _- |
| N/A | `aria-dialog-name`<br/>aria-dialog-name | ARIA dialog elements without accessible names may prevent screen readers users from discerning the purpose of these elements. Learn how to make ARIA dialog elements more accessible . | _- |
| N/A | `aria-hidden-focus`<br/>aria-hidden-focus | Focusable descendents within an [aria-hidden="true"] element prevent those interactive elements from being available to users of assistive technologies like screen readers. Learn how aria-hidden affects focusable elem... | _- |
| N/A | `aria-input-field-name`<br/>ARIA input fields have accessible names | When an input field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn more about input field labels . | _- |
| N/A | `aria-meter-name`<br/>aria-meter-name | When a meter element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to name meter elements . | _- |
| N/A | `aria-progressbar-name`<br/>aria-progressbar-name | When a progressbar element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to label progressbar elements . | _- |
| N/A | `aria-required-children`<br/>aria-required-children | Some ARIA parent roles must contain specific child roles to perform their intended accessibility functions. Learn more about roles and required children elements . | _- |
| N/A | `aria-required-parent`<br/>aria-required-parent | Some ARIA child roles must be contained by specific parent roles to properly perform their intended accessibility functions. Learn more about ARIA roles and required parent element . | _- |
| N/A | `aria-text`<br/>aria-text | Adding role=text around a text node split by markup enables VoiceOver to treat it as one phrase, but the element's focusable descendents will not be announced. Learn more about the role=text attribute . | _- |
| N/A | `aria-toggle-field-name`<br/>ARIA toggle fields have accessible names | When a toggle field doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn more about toggle fields . | _- |
| N/A | `aria-tooltip-name`<br/>aria-tooltip-name | When a tooltip element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn how to name tooltip elements . | _- |
| N/A | `aria-treeitem-name`<br/>aria-treeitem-name | When a treeitem element doesn't have an accessible name, screen readers announce it with a generic name, making it unusable for users who rely on screen readers. Learn more about labeling treeitem elements . | _- |
| N/A | `button-name`<br/>Buttons have an accessible name | When a button doesn't have an accessible name, screen readers announce it as "button", making it unusable for users who rely on screen readers. Learn how to make buttons more accessible . | _- |
| N/A | `bypass`<br/>The page contains a heading, skip link, or landmark region | Adding ways to bypass repetitive content lets keyboard users navigate the page more efficiently. Learn more about bypass blocks . | _- |
| N/A | `definition-list`<br/>definition-list | When definition lists are not properly marked up, screen readers may produce confusing or inaccurate output. Learn how to structure definition lists correctly . | _- |
| N/A | `dlitem`<br/>dlitem | Definition list items ( &lt;dt&gt; and &lt;dd&gt; ) must be wrapped in a parent &lt;dl&gt; element to ensure that screen readers can properly announce them. Learn how to structure definition lists correctly . | _- |
| N/A | `duplicate-id-aria`<br/>ARIA IDs are unique | The value of an ARIA ID must be unique to prevent other instances from being overlooked by assistive technologies. Learn how to fix duplicate ARIA IDs . | _- |
| N/A | `form-field-multiple-labels`<br/>No form fields have multiple labels | Form fields with multiple labels can be confusingly announced by assistive technologies like screen readers which use either the first, the last, or all of the labels. Learn how to use form labels . | _- |
| N/A | `frame-title`<br/>frame-title | Screen reader users rely on frame titles to describe the contents of frames. Learn more about frame titles . | _- |
| N/A | `html-xml-lang-mismatch`<br/>html-xml-lang-mismatch | If the webpage does not specify a consistent language, then the screen reader might not announce the page's text correctly. Learn more about the lang attribute . | _- |
| N/A | `input-button-name`<br/>Input buttons have discernible text. | Adding discernable and accessible text to input buttons may help screen reader users understand the purpose of the input button. Learn more about input buttons . | _- |
| N/A | `input-image-alt`<br/>input-image-alt | When an image is being used as an &lt;input&gt; button, providing alternative text can help screen reader users understand the purpose of the button. Learn about input image alt text . | _- |
| N/A | `link-in-text-block`<br/>Links are distinguishable without relying on color. | Low-contrast text is difficult or impossible for many users to read. Link text that is discernible improves the experience for users with low vision. Learn how to make links distinguishable . | _- |
| N/A | `meta-refresh`<br/>meta-refresh | Users do not expect a page to refresh automatically, and doing so will move focus back to the top of the page. This may create a frustrating or confusing experience. Learn more about the refresh meta tag . | _- |
| N/A | `meta-viewport`<br/>meta-viewport | Disabling zooming is problematic for users with low vision who rely on screen magnification to properly see the contents of a web page. Learn more about the viewport meta tag . | _- |
| N/A | `object-alt`<br/>object-alt | Screen readers cannot translate non-text content. Adding alternate text to &lt;object&gt; elements helps screen readers convey meaning to users. Learn more about alt text for object elements . | _- |
| N/A | `select-name`<br/>Select elements have associated label elements. | Form elements without effective labels can create frustrating experiences for screen reader users. Learn more about the select element . | _- |
| N/A | `skip-link`<br/>Skip links are focusable. | Including a skip link can help users skip to the main content to save time. Learn more about skip links . | _- |
| N/A | `th-has-data-cells`<br/>th-has-data-cells | Screen readers have features to make navigating tables easier. Ensuring table headers always refer to some set of cells may improve the experience for screen reader users. Learn more about table headers . | _- |
| N/A | `valid-lang`<br/>valid-lang | Specifying a valid BCP 47 language on elements helps ensure that text is pronounced correctly by a screen reader. Learn how to use the lang attribute . | _- |
| N/A | `video-caption`<br/>video-caption | When a video provides a caption it is easier for deaf and hearing impaired users to access its information. Learn more about video captions . | _- |
| N/A | `autocomplete-valid`<br/>autocomplete-valid | The autocomplete attribute values must be valid and correctly applied for screen readers to function correctly. Learn more about valid autocomplete values . | _- |
| N/A | `presentation-role-conflict`<br/>presentation-role-conflict | There are certain cases where the semantic role of an element with role="none" or role="presentation" does not resolve to none or presentation. To ensure the element remains removed from the accessibility tree, you sh... | _- |
| N/A | `svg-img-alt`<br/>svg-img-alt | Ensures SVG elements with an img , graphics-document or graphics-symbol role have an accessible text alternative. Learn more about SVG alt text . | _- |
| N/A | `table-duplicate-name`<br/>table-duplicate-name | The summary attribute should describe the table structure, while &lt;caption&gt; should have the onscreen title. Accurate table mark-up helps users of screen readers. Learn more about summary and caption . | _- |
| N/A | `empty-heading`<br/>All heading elements contain content. | A heading with no content or inaccessible text prevent screen reader users from accessing information on the page's structure. Learn more about headings . | _- |
| N/A | `aria-allowed-role`<br/>Uses ARIA roles only on compatible elements | Many HTML elements can only be assigned certain ARIA roles. Using ARIA roles where they are not allowed can interfere with the accessibility of the web page. Learn more about ARIA roles . | _- |
| N/A | `image-redundant-alt`<br/>image-redundant-alt | Informative elements should aim for short, descriptive alternative text. Alternative text that is exactly the same as the text adjacent to the link or image is potentially confusing for screen reader users, because th... | _- |
| N/A | `identical-links-same-purpose`<br/>Identical links have the same purpose. | Links with the same destination should have the same description, to help users understand the link's purpose and decide whether to follow it. Learn more about identical links . | _- |

#### General (2 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `errors-in-console`<br/>Browser errors were logged to the console | Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. Learn more about this errors in console diagnostic audit Show 3rd-party resources ( 1 ... | _- |
| INFO | `js-libraries`<br/>Detected JavaScript libraries | All front-end JavaScript libraries detected on the page. Learn more about this JavaScript library detection diagnostic audit . | _- |

#### Trust and Safety (5 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| INFO | `csp-xss`<br/>Ensure CSP is effective against XSS attacks | A strong Content Security Policy (CSP) significantly reduces the risk of cross-site scripting (XSS) attacks. Learn how to use a CSP to prevent XSS | _- |
| INFO | `has-hsts`<br/>Use a strong HSTS policy | Deployment of the HSTS header significantly reduces the risk of downgrading HTTP connections and eavesdropping attacks. A rollout in stages, starting with a low max-age is recommended. Learn more about using a strong ... | _- |
| INFO | `origin-isolation`<br/>Ensure proper origin isolation with COOP | The Cross-Origin-Opener-Policy (COOP) can be used to isolate the top-level window from other documents such as pop-ups. Learn more about deploying the COOP header. | _- |
| INFO | `clickjacking-mitigation`<br/>Mitigate clickjacking with XFO or CSP | The X-Frame-Options (XFO) header or the frame-ancestors directive in the Content-Security-Policy (CSP) header control where a page can be embedded. These can mitigate clickjacking attacks by blocking some or all sites... | _- |
| INFO | `trusted-types-xss`<br/>Mitigate DOM-based XSS with Trusted Types | The require-trusted-types-for directive in the Content-Security-Policy (CSP) header instructs user agents to control the data passed to DOM XSS sink functions. Learn more about mitigating DOM-based XSS with Trusted Ty... | _- |

#### Browser Compatibility (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| INFO | `baseline`<br/>Baseline Features | Lists web features used on the page and their Baseline status as of 2026-05-01. Learn more about Baseline . | _- |

#### Passed audits (12 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `is-on-https`<br/>Uses HTTPS | _(no description)_ | _- |
| CHECK | `deprecations`<br/>Avoids deprecated APIs | _(no description)_ | _- |
| CHECK | `third-party-cookies`<br/>Avoids third-party cookies | _(no description)_ | _- |
| CHECK | `paste-preventing-inputs`<br/>Allows users to paste into input fields | _(no description)_ | _- |
| CHECK | `geolocation-on-start`<br/>Avoids requesting the geolocation permission on page load | _(no description)_ | _- |
| CHECK | `notification-on-start`<br/>Avoids requesting the notification permission on page load | _(no description)_ | _- |
| CHECK | `image-aspect-ratio`<br/>Displays images with correct aspect ratio | _(no description)_ | _- |
| CHECK | `image-size-responsive`<br/>Serves images with appropriate resolution | _(no description)_ | _- |
| CHECK | `doctype`<br/>Page has the HTML doctype | _(no description)_ | _- |
| CHECK | `charset`<br/>Properly defines charset | _(no description)_ | _- |
| CHECK | `inspector-issues`<br/>inspector-issues | _(no description)_ | _- |
| CHECK | `valid-source-maps`<br/>Page has valid source maps | Source maps translate minified code to the original source code. This helps developers debug in production. In addition, Lighthouse is able to provide further insights. Consider deploying source maps to take advantage... | _- |

#### Not applicable (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| N/A | `redirects-http`<br/>Redirects HTTP traffic to HTTPS | Make sure that you redirect all HTTP traffic to HTTPS in order to enable secure web features for all your users. Learn more . | _- |

#### Additional items to manually check (1 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| MANUAL | `structured-data`<br/>Structured data is valid | Run the Structured Data Testing Tool to validate structured data. Learn more about Structured Data . | _- |

#### Passed audits (8 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| CHECK | `is-crawlable`<br/>Page isn’t blocked from indexing | _(no description)_ | _- |
| CHECK | `document-title`<br/>document-title | _(no description)_ | _- |
| CHECK | `meta-description`<br/>Document has a meta description | _(no description)_ | _- |
| CHECK | `http-status-code`<br/>Page has successful HTTP status code | _(no description)_ | _- |
| CHECK | `link-text`<br/>Links have descriptive text | _(no description)_ | _- |
| CHECK | `crawlable-anchors`<br/>Links are crawlable | _(no description)_ | _- |
| CHECK | `image-alt`<br/>image-alt | _(no description)_ | _- |
| CHECK | `hreflang`<br/>hreflang | _(no description)_ | _- |

#### Not applicable (2 audits)

| Status | Audit | Finding | Est. saving |
|---|---|---|---|
| N/A | `robots-txt`<br/>robots.txt is valid | If your robots.txt file is malformed, crawlers may not be able to understand how you want your website to be crawled or indexed. Learn more about robots.txt . | _- |
| N/A | `canonical`<br/>canonical | Canonical links suggest which URL to show in search results. Learn more about canonical links . | _- |

### 2.4 Third-party resources (0 entities)

| Entity | Total size | Total duration |
|---|---|---|
| GitHub | 13.9 KiB | 550 ms |
| JSDelivr CDN | 855.0 KiB | 1,230 ms |
| Cloudflare CDN | 196.2 KiB | 600 ms |
| GitHub | 378 KiB | (onth0s.github.io) |
| JSDelivr CDN | 855 KiB | (cdn.jsdelivr.net) |
| Cloudflare CDN | 2 KiB | (cdnjs.cloudflare.com) |

### 2.5 Critical request chain

**Maximum critical path latency: 1,168 ms** (44 nodes)

| URL | Duration | Size |
|---|---|---|
| `https://onth0s.github.io/markdown-viewer/` | 165 ms | 12.40 KiB |
| `https://onth0s.github.io/markdown-viewer/css/github-markdown-dark_dimmed.css` | 320 ms | 5.80 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css` | 205 ms | 1.41 KiB |
| `https://onth0s.github.io/markdown-viewer/css/style.css` | 304 ms | 0.88 KiB |
| `https://onth0s.github.io/markdown-viewer/css/variables.css` | 442 ms | 2.51 KiB |
| `https://onth0s.github.io/markdown-viewer/monaco.ttf` | 692 ms | 39.56 KiB |
| `https://onth0s.github.io/markdown-viewer/Roboto.ttf` | 692 ms | 275.46 KiB |
| `https://onth0s.github.io/markdown-viewer/css/reset.css` | 438 ms | 1.10 KiB |
| `https://onth0s.github.io/markdown-viewer/css/layout.css` | 455 ms | 1.24 KiB |
| `https://onth0s.github.io/markdown-viewer/css/header.css` | 452 ms | 2.28 KiB |
| `https://onth0s.github.io/markdown-viewer/css/editor.css` | 435 ms | 1.55 KiB |
| `https://onth0s.github.io/markdown-viewer/css/preview.css` | 431 ms | 2.26 KiB |
| `https://onth0s.github.io/markdown-viewer/css/scrollbars.css` | 448 ms | 2.12 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.4.0/purify.min.js` | 230 ms | 1.00 KiB |
| `https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js` | 177 ms | 14.12 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js` | 191 ms | 3.71 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js` | 185 ms | 3.12 KiB |
| `https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js` | 233 ms | 840.88 KiB |
| `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js` | 204 ms | 188.36 KiB |
| `https://onth0s.github.io/markdown-viewer/js/main.js` | 301 ms | 2.69 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/constants.js` | 882 ms | 1.33 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/storage.js` | 888 ms | 1.32 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/ui-divider.js` | 896 ms | 1.66 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/scroll-utils.js` | 901 ms | 1.83 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/logo-engine.js` | 893 ms | 1.40 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/scroll-sync.js` | 886 ms | 1.67 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/theme-controller.js` | 889 ms | 1.98 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/theme-engine.js` | 1,022 ms | 2.86 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/settings-panel.js` | 889 ms | 2.06 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/color-engine.js` | 1,018 ms | 1.25 KiB |
| `https://onth0s.github.io/markdown-viewer/js/editor/editor-controller.js` | 892 ms | 1.44 KiB |
| `https://onth0s.github.io/markdown-viewer/js/editor/highlighter.js` | 1,018 ms | 1.84 KiB |
| `https://onth0s.github.io/markdown-viewer/js/editor/scrollbars.js` | 1,028 ms | 1.70 KiB |
| `https://onth0s.github.io/markdown-viewer/DEFAULT.md` | 1,168 ms | 2.65 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/mermaid-renderer.js` | 901 ms | 1.66 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/markdown-renderer.js` | 883 ms | 2.41 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/utils.js` | 1,017 ms | 0.99 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/scrollbars.js` | 883 ms | 1.57 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/hscrollbar.js` | 888 ms | 2.37 KiB |
| `https://onth0s.github.io/markdown-viewer/js/preview/actions.js` | 882 ms | 2.30 KiB |
| `https://onth0s.github.io/markdown-viewer/js/selection/selection-engine.js` | 883 ms | 1.31 KiB |
| `https://onth0s.github.io/markdown-viewer/js/selection/source-mapper.js` | 1,019 ms | 1.87 KiB |
| `https://onth0s.github.io/markdown-viewer/js/selection/dom-highlighter.js` | 1,017 ms | 2.47 KiB |
| `https://onth0s.github.io/markdown-viewer/js/common/emoji-helper.js` | 895 ms | 1.56 KiB |

## 3. Mobile vs Desktop - delta

| Audit | Mobile | Desktop |
|---|---|---|
| `bootup-time` Reduce JavaScript execution time | 1.3 s | 0.5 s |
| `cache-insight` Use efficient cache lifetimes | Est savings of 433 KiB | Est savings of 434 KiB |
| `cls-culprits-insight` Layout shift culprits | 0.044 | 0.003 |
| `mainthread-work-breakdown` Minimizes main-thread work | 1.8 s | 0.7 s |
| `render-blocking-insight` Render-blocking requests | Est savings of 2,390 ms | Est savings of 1,120 ms |

## 4. Full audit inventory (all 132 ids, both profiles)

| Audit id | Title |
|---|---|
| `render-blocking-insight` | Render-blocking requests |
| `cache-insight` | Use efficient cache lifetimes |
| `legacy-javascript-insight` | Legacy JavaScript |
| `forced-reflow-insight` | Forced reflow |
| `network-dependency-tree-insight` | Network dependency tree |
| `viewport-insight` | Optimize viewport for mobile |
| `cls-culprits-insight` | Layout shift culprits |
| `lcp-breakdown-insight` | LCP breakdown |
| `third-parties-insight` | 3rd parties |
| `bootup-time` | Reduce JavaScript execution time |
| `unused-javascript` | Reduce unused JavaScript |
| `long-tasks` | Avoid long main-thread tasks |
| `document-latency-insight` | Document request latency |
| `dom-size-insight` | Optimize DOM size |
| `duplicated-javascript-insight` | Duplicated JavaScript |
| `font-display-insight` | Font display |
| `image-delivery-insight` | Improve image delivery |
| `inp-breakdown-insight` | INP breakdown |
| `lcp-discovery-insight` | LCP request discovery |
| `unminified-css` | Minify CSS |
| `unminified-javascript` | Minify JavaScript |
| `unused-css-rules` | Reduce unused CSS |
| `total-byte-weight` | Avoids enormous network payloads |
| `user-timings` | User Timing marks and measures |
| `mainthread-work-breakdown` | Minimizes main-thread work |
| `non-composited-animations` | Avoid non-composited animations |
| `unsized-images` |  |
| `label` | Form elements do not have associated labels |
| `link-name` | Links do not have a discernible name |
| `color-contrast` | Background and foreground colors do not have a sufficient contrast ratio. |
| `landmark-one-main` | Document does not have a main landmark. |
| `focusable-controls` | Interactive controls are keyboard focusable |
| `interactive-element-affordance` | Interactive elements indicate their purpose and state |
| `logical-tab-order` | The page has a logical tab order |
| `visual-order-follows-dom` | Visual order on the page follows DOM order |
| `focus-traps` | User focus is not accidentally trapped in a region |
| `managed-focus` | The user's focus is directed to new content added to the page |
| `use-landmarks` | HTML5 landmark elements are used to improve navigation |
| `offscreen-content-hidden` | Offscreen content is hidden from assistive technology |
| `custom-controls-labels` | Custom controls have associated labels |
| `custom-controls-roles` | Custom controls have ARIA roles |
| `aria-allowed-attr` |  |
| `aria-hidden-body` |  |
| `aria-required-attr` |  |
| `aria-roles` |  |
| `aria-valid-attr-value` |  |
| `aria-valid-attr` |  |
| `image-alt` |  |
| `aria-conditional-attr` | ARIA attributes are used as specified for the element's role |
| `aria-prohibited-attr` | Elements use only permitted ARIA attributes |
| `document-title` |  |
| `html-has-lang` |  |
| `html-lang-valid` |  |
| `list` |  |
| `listitem` |  |
| `tabindex` |  |
| `target-size` | Touch targets have sufficient size and spacing. |
| `td-headers-attr` |  |
| `heading-order` | Heading elements appear in a sequentially-descending order |
| `aria-deprecated-role` | Deprecated ARIA roles were not used |
| `accesskeys` |  |
| `aria-command-name` |  |
| `aria-dialog-name` |  |
| `aria-hidden-focus` |  |
| `aria-input-field-name` | ARIA input fields have accessible names |
| `aria-meter-name` |  |
| `aria-progressbar-name` |  |
| `aria-required-children` |  |
| `aria-required-parent` |  |
| `aria-text` |  |
| `aria-toggle-field-name` | ARIA toggle fields have accessible names |
| `aria-tooltip-name` |  |
| `aria-treeitem-name` |  |
| `button-name` | Buttons have an accessible name |
| `bypass` | The page contains a heading, skip link, or landmark region |
| `definition-list` |  |
| `dlitem` |  |
| `duplicate-id-aria` | ARIA IDs are unique |
| `form-field-multiple-labels` | No form fields have multiple labels |
| `frame-title` |  |
| `html-xml-lang-mismatch` |  |
| `input-button-name` | Input buttons have discernible text. |
| `input-image-alt` |  |
| `link-in-text-block` | Links are distinguishable without relying on color. |
| `meta-refresh` |  |
| `meta-viewport` |  |
| `object-alt` |  |
| `select-name` | Select elements have associated label elements. |
| `skip-link` | Skip links are focusable. |
| `th-has-data-cells` |  |
| `valid-lang` |  |
| `video-caption` |  |
| `autocomplete-valid` |  |
| `presentation-role-conflict` |  |
| `svg-img-alt` |  |
| `table-duplicate-name` |  |
| `empty-heading` | All heading elements contain content. |
| `aria-allowed-role` | Uses ARIA roles only on compatible elements |
| `image-redundant-alt` |  |
| `identical-links-same-purpose` | Identical links have the same purpose. |
| `errors-in-console` | Browser errors were logged to the console |
| `js-libraries` | Detected JavaScript libraries |
| `csp-xss` | Ensure CSP is effective against XSS attacks |
| `has-hsts` | Use a strong HSTS policy |
| `origin-isolation` | Ensure proper origin isolation with COOP |
| `clickjacking-mitigation` | Mitigate clickjacking with XFO or CSP |
| `trusted-types-xss` | Mitigate DOM-based XSS with Trusted Types |
| `baseline` | Baseline Features |
| `is-on-https` | Uses HTTPS |
| `deprecations` | Avoids deprecated APIs |
| `third-party-cookies` | Avoids third-party cookies |
| `paste-preventing-inputs` | Allows users to paste into input fields |
| `geolocation-on-start` | Avoids requesting the geolocation permission on page load |
| `notification-on-start` | Avoids requesting the notification permission on page load |
| `image-aspect-ratio` | Displays images with correct aspect ratio |
| `image-size-responsive` | Serves images with appropriate resolution |
| `doctype` | Page has the HTML doctype |
| `charset` | Properly defines charset |
| `inspector-issues` |  |
| `valid-source-maps` | Page has valid source maps |
| `redirects-http` | Redirects HTTP traffic to HTTPS |
| `structured-data` | Structured data is valid |
| `is-crawlable` | Page isn’t blocked from indexing |
| `meta-description` | Document has a meta description |
| `http-status-code` | Page has successful HTTP status code |
| `link-text` | Links have descriptive text |
| `crawlable-anchors` | Links are crawlable |
| `hreflang` |  |
| `robots-txt` | robots.txt is valid |
| `canonical` |  |

## 5. Source dump - structure

`misc/NOTES.md` is 1.6 MB of raw PageSpeed HTML. Only ~3 % of it is the actual report:

```
Lines 1      : 4 KB of <head> (analytics, scripts, base URL)
Lines 2-2352 : Mobile report stylesheet (report-styles.css) + fireworks CSS
Lines 2353   : End of mobile <style>, <body> starts
Lines 2353-2570 : Mobile Lighthouse HTML (scores, audits, 3p, critical path, footer)
Lines 2571-4896 : Desktop report stylesheet (duplicated CSS, ~2326 lines)
Lines 4897-5113 : Desktop Lighthouse HTML
```

Roughly **9 800 lines of CSS boilerplate** are interleaved with **~440 lines of actual report data**.
The MD above was produced by parsing both report bodies with `re` and a small Python script in `misc/parse_lh.py`.
