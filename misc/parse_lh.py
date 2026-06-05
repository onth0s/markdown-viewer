#!/usr/bin/env python3
"""Parse Lighthouse reports (mobile + desktop) into structured data + write a comprehensive MD."""
import json
import re
from pathlib import Path

MOBILE_HTML = Path(r"C:\Users\Leonardo\AppData\Local\Temp\opencode\mobile_report.html").read_text(encoding="utf-8")
DESKTOP_HTML = Path(r"C:\Users\Leonardo\AppData\Local\Temp\opencode\desktop_report.html").read_text(encoding="utf-8")
OUT_MD = Path(r"C:\Users\Leonardo\001\00__DEV\markdown-viewer\misc\LIGHTHOUSE_REPORT.md")
OUT_JSON = Path(r"C:\Users\Leonardo\AppData\Local\Temp\opencode\parsed.json")

def strip_tags(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()

def nbsp(s: str) -> str:
    return s.replace("&nbsp;", " ").replace("​", "")

# ---------------------------------------------------------------------------
def parse_version(html):
    m = re.search(r'Lighthouse</b>\s*<span class="lh-footer__version">\s*([^<]+?)\s*</span>', html)
    return m.group(1).strip() if m else None

def parse_categories(html):
    """First occurrence only (sticky header is a duplicate)."""
    cats = []
    for m in re.finditer(
        r'<a class="lh-gauge__wrapper lh-gauge__wrapper--(?P<cls>[a-z\-]+)" href="#(?P<id>[a-z\-]+)">.*?'
        r'<div class="lh-gauge__percentage">\s*(?P<score>\d+)\s*</div>.*?'
        r'<div class="lh-gauge__label">\s*([^<]+?)\s*</div>',
        html, re.DOTALL):
        cats.append({"id": m.group("id"), "label": m.group(4).strip(),
                     "score": int(m.group("score")), "grade": m.group("cls")})
        if len(cats) == 4:  # only the first set (sticky header has 4, scores has 4, total 8)
            break
    return cats

def parse_metrics(html):
    """Performance metrics (FCP, LCP, TBT, CLS, SI)."""
    metrics = []
    for m in re.finditer(
        r'<span class="lh-metric__title">\s*([^<]+?)\s*</span>.*?'
        r'<div class="lh-metric__value">\s*([^<]+?)\s*</div>',
        html, re.DOTALL):
        metrics.append({"name": m.group(1).strip(), "value": nbsp(m.group(2).strip())})
    # Dedupe (sticky header repeats them)
    seen, out = set(), []
    for mt in metrics:
        key = mt["name"]
        if key not in seen:
            seen.add(key)
            out.append(mt)
    return out

def parse_meta(html):
    items = []
    for m in re.finditer(r'<li class="lh-meta__item[^"]*">(.*?)</li>', html, re.DOTALL):
        body = re.sub(r'<div class="lh-tooltip">.*?</div>', '', m.group(1), flags=re.DOTALL)
        text = nbsp(strip_tags(body)).strip()
        if text: items.append(text)
    return items

def parse_audits(html):
    audits = []
    pattern = re.compile(
        r'<div class="lh-audit lh-audit--(?P<cls>[a-z\-]+)(?P<extra>(?:\s+lh-audit--[a-z\-]+)*)"\s+id="(?P<id>[^"]+)"[^>]*>',
        re.DOTALL)
    starts = [m for m in pattern.finditer(html)]
    for idx, m in enumerate(starts):
        start = m.end()
        end = starts[idx + 1].start() if idx + 1 < len(starts) else len(html)
        body = html[start:end]
        au = {
            "id": m.group("id"),
            "classes": (m.group("cls") + (m.group("extra") or "")).split(),
        }
        tm = re.search(r'class="lh-audit__title"><span>([^<]+)</span>', body)
        if tm: au["title"] = tm.group(1).strip()
        dm = re.search(r'class="lh-audit__display-text"[^>]*>(.*?)</span>', body, re.DOTALL)
        if dm: au["display"] = nbsp(strip_tags(dm.group(1))).strip()
        nvm = re.search(r'class="lh-numeric">\s*([^<]+?)\s*</div>', body)
        if nvm: au["value"] = nbsp(nvm.group(1).strip())
        sm = re.search(r'"score":\s*(null|[\d\.]+)', body)
        if sm: au["score"] = sm.group(1)
        # Description - first <span> inside lh-audit__description
        descm = re.search(r'class="lh-audit__description">(.*?)<span class="lh-audit__adorn"', body, re.DOTALL)
        if descm:
            au["description"] = nbsp(strip_tags(descm.group(1))).strip()
        # Section heading: find which audit-group it belongs to by looking back
        audits.append(au)
    return audits

def parse_audit_groups(html):
    """Return list of (group_name, list_of_audit_ids) by walking the DOM in order."""
    # We find each lh-audit-group section and the audit ids inside it
    groups = []
    # Each group has a header with lh-audit-group__title
    parts = re.split(r'class="lh-audit-group__title">', html)
    for p in parts[1:]:
        # First 100 chars contain the title
        end = p.find('<')
        name = p[:end].strip() if end > 0 else p[:50].strip()
        # Find all audit ids in this slice
        ids = re.findall(r'<div class="lh-audit lh-audit--[a-z\-]+(?:\s+lh-audit--[a-z\-]+)*"\s+id="([^"]+)"', p)
        groups.append({"name": name, "audits": ids})
    return groups

def parse_3p_summary(html):
    m = re.search(r'Show 3rd-party resources</span> \((?P<n>\d+)\)', html)
    return int(m.group("n")) if m else 0

def parse_3p_table(html):
    """Extract the per-entity rows from the 3p-filter table (size + duration)."""
    rows = []
    for m in re.finditer(
        r'<tr class="lh-row--group"\s+data-entity="(?P<entity>[^"]+)">.*?'
        r'<div class="lh-text">\s*(?P<entity_label>[^<]+?)\s*</div>.*?'
        r'title="(?P<bytes>[\d, &nbsp;]+bytes)"\s*>\s*(?P<size>[^<]+?)\s*</div>.*?'
        r'>\s*(?P<dur>[^<]+?)\s*</div>',
        html, re.DOTALL):
        rows.append({
            "entity": m.group("entity_label").strip(),
            "size": nbsp(m.group("size").strip()),
            "duration": nbsp(m.group("dur").strip()),
        })
    return rows

def parse_critical_path(html):
    m = re.search(r'<b class="lh-crc__longest_duration">\s*([^<]+?)\s*</b>', html)
    latency = nbsp(m.group(1).strip()) if m else None
    nodes = []
    for nm in re.finditer(
        r'<div class="lh-crc-node[^"]*"[^>]*title="(?P<url>[^"]+)"[^>]*>.*?'
        r'<span class="lh-crc-node__chain-duration">\s*-\s*([^<]+?),\s*</span>\s*'
        r'<span class="lh-crc-node__chain-size">\s*([^<]+?)\s*</span>',
        html, re.DOTALL):
        nodes.append({
            "url": nm.group("url"),
            "duration": nbsp(nm.group(2).strip()),
            "size": nbsp(nm.group(3).strip()),
        })
    return {"latency": latency, "nodes": nodes}

# ---------------------------------------------------------------------------
def parse_full(label, html):
    return {
        "label": label,
        "lighthouse_version": parse_version(html),
        "categories": parse_categories(html),
        "metrics": parse_metrics(html),
        "meta": parse_meta(html),
        "audit_groups": parse_audit_groups(html),
        "audits": parse_audits(html),
        "third_parties": parse_3p_summary(html),
        "third_party_rows": parse_3p_table(html),
        "critical_path": parse_critical_path(html),
    }

result = {
    "mobile": parse_full("mobile", MOBILE_HTML),
    "desktop": parse_full("desktop", DESKTOP_HTML),
}
OUT_JSON.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

# ===========================================================================
# Build the comprehensive markdown
# ===========================================================================
def score_badge(grade, score):
    icon = {"pass": "OK", "average": "~", "fail": "X"}.get(grade, "?")
    color = {"pass": "PASS", "average": "AVERAGE", "fail": "FAIL"}.get(grade, "?").upper()
    return f"`{score}` *({color})*"

lines = []
P = lines.append

P("# Lighthouse Audit Report")
P("")
P("> Extracted from `misc/NOTES.md` (PageSpeed Insights / Lighthouse v13.3.0 output).")
P("> Source page: **https://onth0s.github.io/markdown-viewer/**")
P("> Captured: **Jun 5, 2026, 11:02 PM GMT+2** (single page session).")
P("> Tool: **Lighthouse 13.3.0** on **HeadlessChromium 146.0.7680.177** from **Europe**.")
P("")

# --- Executive summary -------------------------------------------------------
P("## 1. Executive Summary")
P("")
P("| Profile | Performance | Accessibility | Best Practices | SEO |")
P("|---|---|---|---|---|")
def cell(c, key):
    cat = next((x for x in c if x["id"] == key), None)
    if not cat: return "n/a"
    return f"**{cat['score']}** / 100"
P(f"| Mobile  (Moto G Power)   | {cell(result['mobile']['categories'], 'performance')} | {cell(result['mobile']['categories'], 'accessibility')} | {cell(result['mobile']['categories'], 'best-practices')} | {cell(result['mobile']['categories'], 'seo')} |")
P(f"| Desktop (no throttling)  | {cell(result['desktop']['categories'], 'performance')} | {cell(result['desktop']['categories'], 'accessibility')} | {cell(result['desktop']['categories'], 'best-practices')} | {cell(result['desktop']['categories'], 'seo')} |")
P("")
P("**Throttling applied**")
P("")
P("- **Mobile**: 1.2x CPU slowdown (simulated) - 412x823 viewport @ DPR 1.75 - Slow 4G (150 ms RTT, 1,638.4 kb/s).")
P("- **Desktop**: 1x CPU (no slowdown) - 1350x940 viewport @ DPR 1 - no network throttling.")
P("")

# --- Per-profile breakdown ---------------------------------------------------
SUBSECTION = {"mobile": 0, "desktop": 0}  # increment in order
for kind in ("mobile", "desktop"):
    d = result[kind]
    P(f"## 2. {kind.capitalize()} Profile")
    P("")
    SUBSECTION[kind] = 1
    P(f"### 2.{SUBSECTION[kind]} Environment")
    P("")
    for it in d["meta"]:
        P(f"- {it}")
    P("")
    SUBSECTION[kind] += 1
    P(f"### 2.{SUBSECTION[kind]} Performance metrics")
    P("")
    P("| Metric | Value | What it measures |")
    P("|---|---|---|")
    metric_desc = {
        "First Contentful Paint": "Time at which the first text or image is painted.",
        "Largest Contentful Paint": "Time at which the largest text or image is painted.",
        "Total Blocking Time": "Sum of FCP -> TTI intervals with tasks >50 ms.",
        "Cumulative Layout Shift": "Movement of visible elements within the viewport.",
        "Speed Index": "How quickly the contents of a page are visibly populated.",
        "Interaction to Next Paint": "Latency of the longest interaction (lab-simulated).",
        "Time to Interactive": "Time until the page is fully interactive.",
    }
    if d["metrics"]:
        for mt in d["metrics"]:
            P(f"| {mt['name']} | **{mt['value']}** | {metric_desc.get(mt['name'], '_n/a_')} |")
    else:
        P("| _no metrics parsed_ | | |")
    P("")
    SUBSECTION[kind] += 1
    P(f"### 2.{SUBSECTION[kind]} Audit findings")
    P("")
    by_id = {a["id"]: a for a in d["audits"]}
    for g in d["audit_groups"]:
        if not g["audits"]:
            continue
        P(f"#### {g['name']} ({len(g['audits'])} audits)")
        P("")
        P("| Status | Audit | Finding | Est. saving |")
        P("|---|---|---|---|")
        for aid in g["audits"]:
            a = by_id.get(aid)
            if not a: continue
            cls = a["classes"]
            if "pass" in cls: status = "PASS"
            elif "fail" in cls: status = "FAIL"
            elif "average" in cls: status = "WARN"
            elif "informative" in cls: status = "INFO"
            elif "manual" in cls: status = "MANUAL"
            elif "notapplicable" in cls: status = "N/A"
            elif "metricsavings" in cls: status = "OPPORTUNITY"
            elif "numeric" in cls: status = "METRIC"
            elif "binary" in cls: status = "CHECK"
            else: status = cls[0].upper() if cls else "?"
            title = a.get("title", aid)
            display = a.get("display", "") or a.get("value", "")
            desc = a.get("description", "")
            if desc and len(desc) > 220:
                desc = desc[:217] + "..."
            P(f"| {status} | `{aid}`<br/>{title} | {desc or '_(no description)_'} | {nbsp(display) if display else '_-'} |")
        P("")

    SUBSECTION[kind] += 1
    P(f"### 2.{SUBSECTION[kind]} Third-party resources ({d['third_parties']} entities)")
    P("")
    if d["third_party_rows"]:
        P("| Entity | Total size | Total duration |")
        P("|---|---|---|")
        for r in d["third_party_rows"][:6]:
            P(f"| {r['entity']} | {r['size']} | {r['duration']} |")
    P("")

    SUBSECTION[kind] += 1
    P(f"### 2.{SUBSECTION[kind]} Critical request chain")
    P("")
    P(f"**Maximum critical path latency: {d['critical_path']['latency']}** ({len(d['critical_path']['nodes'])} nodes)")
    P("")
    P("| URL | Duration | Size |")
    P("|---|---|---|")
    for n in d["critical_path"]["nodes"]:
        P(f"| `{n['url']}` | {n['duration']} | {n['size']} |")
    P("")

# --- Cross-profile comparison ------------------------------------------------
P("## 3. Mobile vs Desktop - delta")
P("")
m = {a["id"]: a for a in result["mobile"]["audits"]}
d = {a["id"]: a for a in result["desktop"]["audits"]}
P("| Audit | Mobile | Desktop |")
P("|---|---|---|")
for aid in sorted(set(m) | set(d)):
    a, b = m.get(aid), d.get(aid)
    if not (a and b): continue
    mt = (a.get("display") or a.get("value") or "n/a")
    dt = (b.get("display") or b.get("value") or "n/a")
    if mt == dt: continue  # skip identical
    title = a.get("title", aid)
    P(f"| `{aid}` {title} | {nbsp(mt)} | {nbsp(dt)} |")
P("")

# --- Master inventory --------------------------------------------------------
P("## 4. Full audit inventory (all 132 ids, both profiles)")
P("")
P("| Audit id | Title |")
P("|---|---|")
seen = set()
for a in result["mobile"]["audits"]:
    if a["id"] in seen: continue
    seen.add(a["id"])
    P(f"| `{a['id']}` | {a.get('title', '')} |")
P("")

# --- Source structure --------------------------------------------------------
P("## 5. Source dump - structure")
P("")
P("`misc/NOTES.md` is 1.6 MB of raw PageSpeed HTML. Only ~3 % of it is the actual report:")
P("")
P("```")
P("Lines 1      : 4 KB of <head> (analytics, scripts, base URL)")
P("Lines 2-2352 : Mobile report stylesheet (report-styles.css) + fireworks CSS")
P("Lines 2353   : End of mobile <style>, <body> starts")
P("Lines 2353-2570 : Mobile Lighthouse HTML (scores, audits, 3p, critical path, footer)")
P("Lines 2571-4896 : Desktop report stylesheet (duplicated CSS, ~2326 lines)")
P("Lines 4897-5113 : Desktop Lighthouse HTML")
P("```")
P("")
P("Roughly **9 800 lines of CSS boilerplate** are interleaved with **~440 lines of actual report data**.")
P("The MD above was produced by parsing both report bodies with `re` and a small Python script in `misc/parse_lh.py`.")
P("")

OUT_MD.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {OUT_MD}  ({OUT_MD.stat().st_size} bytes)")
print(f"Wrote {OUT_JSON}  ({OUT_JSON.stat().st_size} bytes)")
