"""Build the static notebook with Python 3. No dependencies or network access."""
from pathlib import Path
import base64
import datetime
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'src'
VENDOR = ROOT / 'vendor'
ASSET_ROOT = (ROOT / 'assets').resolve()
MIMES = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
}


def base64_file(path):
    return base64.b64encode(path.read_bytes()).decode('ascii')


def load_notes():
    notes = []
    for path in sorted((ROOT / 'notes').glob('*.md')):
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', path.stem):
            raise ValueError(f'{path.name}: use a lowercase, hyphenated filename')
        text = path.read_text(encoding='utf-8')
        match = re.match(r'\A---\n(.*?)\n---\n(.*)\Z', text, re.S)
        if not match:
            raise ValueError(f'{path.name}: missing front matter')
        fields = {}
        allowed = {'title', 'date', 'topic', 'summary', 'abstract', 'example'}
        for line in match[1].splitlines():
            if not line.strip() or line.lstrip().startswith('#'):
                continue
            key, sep, value = line.partition(':')
            if not sep or key not in allowed or key in fields:
                raise ValueError(f'{path.name}: unknown or duplicate field {key!r}')
            value = value.strip()
            if value.startswith('"'):
                value = json.loads(value)
            if not isinstance(value, str):
                raise ValueError(f'{path.name}: {key} must be text')
            fields[key] = value
        for key in ('title', 'date', 'topic', 'summary'):
            if not fields.get(key):
                raise ValueError(f'{path.name}: {key} is required')
        date = datetime.date.fromisoformat(fields['date'])
        if fields.get('example', 'false') not in ('true', 'false'):
            raise ValueError(f'{path.name}: example must be true or false')
        notes.append({
            'id': path.stem, 'title': fields['title'],
            'isoDate': date.isoformat(), 'year': str(date.year),
            'dateShort': date.strftime('%b %d'), 'topic': fields['topic'],
            'desc': fields['summary'], 'deck': fields.get('abstract', ''),
            'example': fields.get('example', 'false') == 'true',
            'body': match[2].strip(),
        })
    return sorted(notes, key=lambda note: (note['isoDate'], note['id']), reverse=True)


def load_assets(notes):
    files = {}
    for note in notes:
        for name in re.findall(r'\]\((assets/[A-Za-z0-9._/-]+)\)', note['body']):
            path = (ROOT / name).resolve()
            if not path.is_relative_to(ASSET_ROOT) or not path.is_file():
                raise ValueError(f'{note["id"]}: missing or invalid public asset {name}')
            mime = MIMES.get(path.suffix.lower())
            if not mime:
                raise ValueError(f'{note["id"]}: unsupported asset type {name}')
            files[name] = {
                'url': f'data:{mime};base64,{base64_file(path)}',
                'name': path.name, 'size': path.stat().st_size,
            }
    return {'files': files}


def inline_json(value):
    # Prevent note text from terminating the HTML script element.
    return json.dumps(value, ensure_ascii=True).replace('<', r'\u003c')


def build():
    notes = load_notes()
    assets = load_assets(notes)
    math_css = (VENDOR / 'katex.min.css').read_text()
    math_css = re.sub(
        r'src:url\(fonts/([^)]*\.woff2)\) format\("woff2"\)[^;}]*',
        lambda m: 'src:url(data:font/woff2;base64,' +
        base64_file(VENDOR / 'fonts' / m[1]) + ') format("woff2")',
        math_css,
    )
    text_fonts = []
    for face, weight, style in [('Regular', 400, 'normal'), ('Bold', 700, 'normal'), ('Italic', 400, 'italic')]:
        data = base64_file(VENDOR / 'iosevka' / f'IosevkaNerdFontMono-{face}.woff')
        text_fonts.append(
            "@font-face{font-family:'Iosevka Nerd Font Mono';src:url(data:font/woff;base64," +
            data + ") format('woff');font-weight:" + str(weight) +
            ';font-style:' + style + ';font-display:swap;}'
        )
    css = '\n'.join(text_fonts) + '\n' + (SOURCE / 'style.css').read_text() + '\n' + math_css
    libraries = '\n'.join((VENDOR / file).read_text() for file in ['katex.min.js', 'marked.min.js', 'purify.min.js'])
    libraries = re.sub(r'//# sourceMappingURL=.*', '', libraries)
    libraries = libraries.replace('</script', r'<\/script')
    app = (SOURCE / 'app.js').read_text().replace('__ASSETS__', inline_json(assets)).replace('__NOTES__', inline_json(notes))
    csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
    html = (
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta name="referrer" content="no-referrer">'
        '<meta http-equiv="Content-Security-Policy" content="' + csp + '">'
        '<title>lanl2vz — the notebook</title>'
        '<meta name="description" content="A personal notebook on mathematics, computation, and related topics.">'
        '<style>body{margin:0}html{scroll-behavior:smooth}\n' + css + '</style></head><body>\n' +
        (SOURCE / 'shell.html').read_text() +
        '<noscript><p>This notebook uses JavaScript to display Markdown and equations.</p></noscript>'
        '\n<script>window.LANL2VZ_STANDALONE=true;\n' + libraries + '\n' + app + '\n</script></body></html>\n'
    )
    output = ROOT.parent / 'index.html'
    output.write_text(html, encoding='utf-8')
    print(f'Built {output.name}: {len(notes)} notes, {len(assets["files"])} referenced assets, {len(html.encode()):,} bytes')


if __name__ == '__main__':
    build()
