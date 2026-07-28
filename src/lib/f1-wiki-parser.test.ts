import { describe, it, expect } from 'vitest'
import {
  stripHtml,
  parseActualitesFromPortal,
  parseActualitesFromActualitePage,
  parseImageDuJour,
  parseClassement,
  parseSaviezVous,
  F1Actualite,
  F1Standing,
} from '@/lib/f1-wiki-parser'

// ── stripHtml ───────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<b>hello</b>')).toBe('hello')
  })

  it('converts &nbsp; to space', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world')
  })

  it('converts &amp; to &', () => {
    expect(stripHtml('foo&amp;bar')).toBe('foo&bar')
  })

  it('converts &lt; and &gt;', () => {
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>')
  })

  it('trims result', () => {
    expect(stripHtml('  <b>text</b>  ')).toBe('text')
  })

  it('handles nested tags', () => {
    expect(stripHtml('<div><span>nested</span></div>')).toBe('nested')
  })

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('')
  })
})

// ── parseActualitesFromPortal ──────────────────────────────────────────────

describe('parseActualitesFromPortal', () => {
  it('returns empty array when no actualités section', () => {
    const result = parseActualitesFromPortal('<div>nothing here</div>')
    expect(result).toEqual([])
  })

  it('parses articles with time and link', () => {
    const html = `
      <span class="boite-coloree-titre">Actualités</span>
      <div class="boite-coloree-contenu">
        <ul>
          <li>
            <time datetime="2025-01-15">15 janv. 2025</time>
            <a href="/wiki/Grand_Prix_de_France">Grand Prix de France</a>
            — Some content here.
          </li>
          <li>
            <time datetime="2025-01-14">14 janv. 2025</time>
            <a href="/wiki/Le_Saviez_Vous">Le Saviez Vous</a>
            — More content.
          </li>
        </ul>
      </div>
    </div>
    </div>
    `
    const result = parseActualitesFromPortal(html)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual<F1Actualite>({
      title: 'Grand Prix de France',
      date: '15 janv. 2025',
      content: '',
      url: 'https://fr.wikipedia.org/wiki/Grand_Prix_de_France',
    })
    expect(result[1].title).toBe('Le Saviez Vous')
  })

  it('limits to 5 articles', () => {
    const items = Array.from({ length: 10 }, (_, i) => (
      `<li><time datetime="2025-01-${String(i + 1).padStart(2, '0')}">${i + 1} janv.</time><a href="/wiki/Article${i}">Article ${i}</a></li>`
    )).join('')

    const html = `
      <span class="boite-coloree-titre">Actualités</span>
      <div class="boite-coloree-contenu"><ul>${items}</ul></div>
    </div>
    </div>
    `
    const result = parseActualitesFromPortal(html)
    expect(result).toHaveLength(5)
  })

  it('skips items missing time or link', () => {
    const html = `
      <span class="boite-coloree-titre">Actualités</span>
      <div class="boite-coloree-contenu">
        <ul>
          <li>no time or link</li>
          <li><time datetime="2025-01-01">1 janv.</time> no link</li>
          <li><time datetime="2025-01-02">2 janv.</time><a href="/wiki/Valid">Valid</a></li>
        </ul>
      </div>
    </div>
    </div>
    `
    const result = parseActualitesFromPortal(html)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Valid')
  })

  it('handles absolute URLs', () => {
    const html = `
      <span class="boite-coloree-titre">Actualités</span>
      <div class="boite-coloree-contenu">
        <ul>
          <li><time datetime="2025-01-01">1 janv.</time><a href="https://example.com/article">External</a></li>
        </ul>
      </div>
    </div>
    </div>
    `
    const result = parseActualitesFromPortal(html)
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe('https://example.com/article')
  })
})

// ── parseActualitesFromActualitePage ───────────────────────────────────────

describe('parseActualitesFromActualitePage', () => {
  it('returns empty array for empty html', () => {
    const result = parseActualitesFromActualitePage('')
    expect(result).toEqual([])
  })

  it('parses articles with date and content', () => {
    const html = `
      <ul>
        <li>
          <time datetime="2025-01-15">15 janv. 2025</time></b>&#160;:
          <a href="/wiki/Article_Un">Article Un</a> — Content paragraph here.
        </li>
      </ul>
    `
    const result = parseActualitesFromActualitePage(html)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Article Un')
    expect(result[0].content).toContain('Content paragraph here')
    expect(result[0].url).toBe('https://fr.wikipedia.org/wiki/Article_Un')
  })

  it('limits to 5 articles', () => {
    const items = Array.from({ length: 10 }, (_, i) => (
      `<li><time datetime="2025-01-${String(i + 1).padStart(2, '0')}">${i + 1} janv.</time></b>&#160;:<a href="/wiki/Article${i}">Article ${i}</a></li>`
    )).join('')

    const html = `<ul>${items}</ul>`
    const result = parseActualitesFromActualitePage(html)
    expect(result).toHaveLength(5)
  })
})

// ── parseImageDuJour ───────────────────────────────────────────────────────

describe('parseImageDuJour', () => {
  it('returns null when no image section', () => {
    const result = parseImageDuJour('<div>nothing</div>')
    expect(result).toBeNull()
  })

  it('parses image with caption and link', () => {
    const html = `
      <span class="boite-coloree-titre">L'image du jour</span>
      <div>
        <img alt="Ferrari F1-75" src="//upload.wikimedia.org/wikipedia/commons/e/gg/F1_car.jpg/330px-F1_car.jpg">
        <a href="/wiki/Fichier:Ferrari_F1-75.jpg" class="mw-file-description">File page</a>
      </div>
      <span class="boite-coloree-titre">Next Section</span>
    `
    const result = parseImageDuJour(html)
    expect(result).not.toBeNull()
    expect(result!.caption).toBe('Ferrari F1-75')
    // Thumbnail URL converted to full-size
    expect(result!.imageUrl).toContain('upload.wikimedia.org/wikipedia/commons/e/gg/F1_car.jpg')
    expect(result!.articleLink).toBe('https://fr.wikipedia.org/wiki/Fichier:Ferrari_F1-75.jpg')
  })

  it('handles already-full-size URLs', () => {
    const html = `
      <span class="boite-coloree-titre">L'image du jour</span>
      <div>
        <img alt="Test" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/image.jpg">
      </div>
      <span class="boite-coloree-titre">Next Section</span>
    `
    const result = parseImageDuJour(html)
    expect(result).not.toBeNull()
    expect(result!.imageUrl).toBe('https://upload.wikimedia.org/wikipedia/commons/a/a0/image.jpg')
  })

  it('defaults articleLink to portal when no link found', () => {
    const html = `
      <span class="boite-coloree-titre">L'image du jour</span>
      <div>
        <img alt="Test" src="//upload.wikimedia.org/wikipedia/commons/thumb/a/a0/x.jpg/330px-x.jpg">
      </div>
      <span class="boite-coloree-titre">Next Section</span>
    `
    const result = parseImageDuJour(html)
    expect(result).not.toBeNull()
    expect(result!.articleLink).toBe('https://fr.wikipedia.org/wiki/Portail:Formule_1')
  })
})

// ── parseClassement ────────────────────────────────────────────────────────

describe('parseClassement', () => {
  it('returns empty array when no tables', () => {
    const result = parseClassement('<div>no tables</div>')
    expect(result).toEqual([])
  })

  it('parses driver standings', () => {
    const html = `
      <table class="datatable"><caption>Classement des pilotes</caption>
        <tr><th>Pos</th><th>Pilote</th><th>Points</th></tr>
        <tr><td>1</td><td><a href="/wiki/Max_Verstappen">Max Verstappen</a></td><td>575</td></tr>
        <tr><td>2</td><td><a href="/wiki/Lando_Norris">Lando Norris</a></td><td>356</td></tr>
      </table>
    `
    const result = parseClassement(html)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('pilotes')
    expect(result[0].rows).toHaveLength(2)
    expect(result[0].rows[0].name).toBe('Max Verstappen')
    expect(result[0].rows[0].points).toBe('575')
  })

  it('parses constructor standings', () => {
    const html = `
      <table class="datatable"><caption>Classement des constructeurs</caption>
        <tr><th>Pos</th><th>Écurie</th><th>Points</th></tr>
        <tr><td>1</td><td><a href="/wiki/McLaren">McLaren</a>-<a href="/wiki/Mercedes">Mercedes</a></td><td>608</td></tr>
      </table>
    `
    const result = parseClassement(html)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('constructeurs')
    expect(result[0].rows[0].name).toBe('McLaren-Mercedes')
  })

  it('parses both tables in one HTML', () => {
    const html = `
      <table class="datatable"><caption>Classement des pilotes</caption>
        <tr><th>Pos</th><th>Pilote</th><th>Points</th></tr>
        <tr><td>1</td><td><a href="/wiki/V">V</a></td><td>100</td></tr>
      </table>
      <table class="datatable"><caption>Classement des constructeurs</caption>
        <tr><th>Pos</th><th>Écurie</th><th>Points</th></tr>
        <tr><td>1</td><td><a href="/wiki/M">M</a></td><td>120</td></tr>
      </table>
    `
    const result = parseClassement(html)
    expect(result).toHaveLength(2)
    expect(result[0].type).toBe('pilotes')
    expect(result[1].type).toBe('constructeurs')
  })
})

// ── parseSaviezVous ────────────────────────────────────────────────────────

describe('parseSaviezVous', () => {
  it('returns null when no section', () => {
    const result = parseSaviezVous('<div>nothing</div>')
    expect(result).toBeNull()
  })

  it('parses facts longer than 30 chars', () => {
    const html = `
      <span class="boite-coloree-titre">Le saviez-vous ?</span>
      <div class="boite-coloree-contenu">
        <ul>
          <li>La Formule 1 a été créée en 1950 lors du premier championnat du monde automobile.</li>
          <li>Un court fait.</li>
          <li>Une autre information intéressante sur les voitures de course de vitesse.</li>
        </ul>
      </div>
    </div>
    </div>
    `
    const result = parseSaviezVous(html)
    expect(result).not.toBeNull()
    expect(result!.facts).toHaveLength(2)
    expect(result!.facts[0]).toContain('1950')
  })

  it('filters out short facts', () => {
    const html = `
      <span class="boite-coloree-titre">Le saviez-vous ?</span>
      <div class="boite-coloree-contenu">
        <ul>
          <li>abc</li>
          <li>short</li>
        </ul>
      </div>
    </div>
    </div>
    `
    const result = parseSaviezVous(html)
    // Parser returns null when no facts pass the length filter
    expect(result).toBeNull()
  })
})
