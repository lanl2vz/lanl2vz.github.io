# lanl2vz — the notebook

A small academic notebook with Iosevka Nerd Font Mono, Markdown, LaTeX equations,
images, and downloadable PDFs. Published at <https://lanl2vz.github.io/>.

The initial entries are marked **example**. The older files under `notes/` and
`resource/` are preserved.

## Add or edit a note

Create `_notebook/notes/my-note.md` using this format:

```markdown
---
title: My note
date: 2026-10-22
topic: Mathematics
summary: A short description for the index.
abstract: An optional summary at the top of the article.
---

Write your note in Markdown. Inline math: $x^2$.

## A calculation

$$
\int_0^1 x\,dx = \frac{1}{2}.
$$

![Figure caption](assets/my-figure.png)

[Supplementary PDF](assets/my-supplement.pdf)
```

Use a lowercase, hyphenated filename. Dates use `YYYY-MM-DD`. The index, years,
and subjects are generated from the note metadata. Set `example: true` only for
demonstration content. The small front-matter format accepts one text value per
line; double-quoted values use JSON quoting.

Put public attachments in `_notebook/assets/`. Use relative paths beginning with
`assets/` and simple filenames without spaces. PNG, JPEG, GIF, WebP, SVG, and PDF
are supported. Only referenced assets are embedded into the built website.

Build with Python 3.9 or newer; no package installation or network is required:

```sh
python3 _notebook/build.py
```

Open `index.html` to review. Commit the Markdown, its public assets, and the
rebuilt `index.html`, then push to `main`. GitHub Pages publishes the repository
root using its existing configuration. The `_notebook/` source directory is
excluded by Jekyll's default underscore-directory rule.

## Authoring and privacy

The public website is for reading. Write and edit Markdown files locally, then
build and publish them using the steps above. There is no browser editor,
draft storage access, GitHub login, access token, or upload service in the site.

All files committed to this repository are public. Keep private drafts outside
the checkout.

## Implementation

- `_notebook/src/`: page structure, CSS, and browser behavior.
- `_notebook/notes/`: intentionally public Markdown notes.
- `_notebook/assets/`: public figures and PDFs.
- `_notebook/vendor/`: bundled libraries, fonts, and their licenses.
- `_notebook/build.py`: standard-library-only static builder.

The website embeds its dependencies and assets locally. It makes no analytics,
font-service, or GitHub API requests. Markdown HTML is escaped, rendered content
is sanitized with DOMPurify, and KaTeX's trusted commands are disabled. Embedded
remote images are not loaded automatically. Ordinary external text links only
navigate when opened by the reader.

Libraries: KaTeX 0.16.22, Marked 15.0.12, DOMPurify 3.4.17. Text uses locally
embedded regular, bold, and italic Iosevka Nerd Font Mono from Nerd Fonts v3.5.1.
The web subsets cover Latin-1, Greek, punctuation, arrows, and selected Nerd Font
glyphs; other scripts use browser fallbacks. Mathematical typefaces remain
separate. Licenses and upstream font attribution are retained in `vendor/`.
