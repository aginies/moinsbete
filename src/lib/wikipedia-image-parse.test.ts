import { describe, it, expect } from 'vitest'
import { extractEntriesFR, extractEntriesEN } from './wikipedia-image-parse'

// Samples mirror the Parsoid (mw-html) markup returned by action=parse since 2026

const FR_HTML = `
<div class="mw-content-ltr mw-parser-output" lang="fr" dir="ltr" data-mw-parsoid-version="0.24.0.0-alpha26" data-mw-html-version="2.8.0">
<h2 style="margin:0 0 10px" id="1er_octobre_2026_Modifier" class="mw-html-heading"><span data-mw-comment-start="" id="h-1er_octobre_2026_Modifier"></span><span id="1er_octobre_2026.0AModifier" typeof="mw:FallbackId"></span><abbr class="abbr" title="Premier">1<sup>er</sup></abbr> octobre 2026
<font style="float:right"><a rel="mw:WikiLink" href="https://fr.wikipedia.org/wiki/Wikipédia:Image_du_jour/1_octobre_2026" title="Wikipédia:Image du jour/1 octobre 2026">Modifier</a></font>
<span data-mw-comment-end="h-1er_octobre_2026_Modifier"></span></h2>
<div style="text-align:center"><div style="overflow:auto"><div style="display:inline-block">
<a href="https://fr.wikipedia.org/wiki/Fichier:Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg" class="mw-file-description" title="La place de la Vieille-Ville à Prague.">
<img resource="https://fr.wikipedia.org/wiki/Fichier:Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg" src="//thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg/500px-Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg?utm_source=fr.wikipedia.org&amp;utm_campaign=parser&amp;utm_content=thumbnail" decoding="async" loading="lazy" alt="La place de la Vieille-Ville à Prague.
 (définition réelle 4 433 × 2 771)" data-file-width="4433" data-file-height="2771" class="mw-file-element"/>
</a>
</div></div></div>
<h2 style="margin:0 0 10px" id="2_octobre_2026_Modifier" class="mw-html-heading"><span data-mw-comment-start="" id="h-2_octobre_2026_Modifier"></span>2 octobre 2026
<span data-mw-comment-end="h-2_octobre_2026_Modifier"></span></h2>
<div style="text-align:center">
<img src="//upload.wikimedia.org/wikipedia/commons/1/12/Ancient_file.jpg" alt="Une image ancienne" class="mw-file-element"/>
<a href="/wiki/Fichier:Ancient_file.jpg" class="mw-file-description">Fichier:Ancient_file.jpg</a>
</div>
</div>`

describe('extractEntriesFR', () => {
  const entries = extractEntriesFR(FR_HTML, 'octobre 2026')

  it('parses Parsoid markup (abbr/sup date, thumb.wikimedia.org src, absolute file href)', () => {
    expect(entries).toHaveLength(2)

    expect(entries[0]).toMatchObject({
      date: '1er octobre 2026',
      archive: 'octobre 2026',
      description: 'La place de la Vieille-Ville à Prague.',
      fileUrl: 'https://fr.wikipedia.org/wiki/Fichier:Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg',
    })
    // 500px thumb upgraded to 1280px, utm query stripped
    expect(entries[0].imageUrl).toBe(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg/1280px-Prague_07-2016_View_from_Old_Town_Hall_Tower_img3.jpg'
    )
  })

  it('still parses legacy markup (plain date, relative file href)', () => {
    expect(entries[1]).toMatchObject({
      date: '2 octobre 2026',
      description: 'Une image ancienne',
      fileUrl: 'https://fr.wikipedia.org/wiki/Fichier:Ancient_file.jpg',
    })
    expect(entries[1].imageUrl).toBe('https://upload.wikimedia.org/wikipedia/commons/1/12/Ancient_file.jpg')
  })

  it('returns empty array for html without date headings', () => {
    expect(extractEntriesFR('<div>no dates here</div>', 'octobre 2026')).toEqual([])
  })
})

const EN_HTML = `
<div class="mw-content-ltr mw-parser-output" lang="en" dir="ltr" data-mw-parsoid-version="0.24.0.0-alpha27" data-mw-html-version="2.8.0">
<hr about="#mwt2" typeof="mw:Transclusion" id="mwBA" data-mw='{"parts":[{"template":{"target":{"wt":"POTD/Day"}}}]}'/>
<p about="#mwt2"><span class="anchor nowrap" id="1"><b>September 1</b></span></p>
<table role="presentation">
<img resource="https://en.wikipedia.org/wiki/File:Viperine_water_snake_(Natrix_maura).jpg" src="//thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Viperine_water_snake_%28Natrix_maura%29.jpg/500px-Viperine_water_snake_%28Natrix_maura%29.jpg?utm_source=en.wikipedia.org&amp;utm_campaign=parser&amp;utm_content=thumbnail" decoding="async" loading="lazy" alt="A viperine water snake" class="mw-file-element"/>
<a href="https://en.wikipedia.org/wiki/File:Viperine_water_snake_(Natrix_maura).jpg" class="mw-file-description">File</a>
</table>
<p about="#mwt3"><span class="anchor nowrap" id="2"><b>September 2</b></span></p>
<table role="presentation">
<img src="//upload.wikimedia.org/wikipedia/commons/2/2x/Legacy_en.jpg" alt="Legacy image" class="mw-file-element"/>
<a href="/wiki/File:Legacy_en.jpg" class="mw-file-description">File</a>
</table>
</div>`

describe('extractEntriesEN', () => {
  const entries = extractEntriesEN(EN_HTML, 'September 2026')

  it('parses Parsoid markup (thumb.wikimedia.org src, absolute file href)', () => {
    expect(entries).toHaveLength(2)

    expect(entries[0]).toMatchObject({
      date: 'September 1',
      archive: 'September 2026',
      description: 'A viperine water snake',
      fileUrl: 'https://en.wikipedia.org/wiki/File:Viperine_water_snake_(Natrix_maura).jpg',
    })
    expect(entries[0].imageUrl).toBe(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Viperine_water_snake_%28Natrix_maura%29.jpg/1280px-Viperine_water_snake_%28Natrix_maura%29.jpg'
    )
  })

  it('still parses legacy markup (relative file href)', () => {
    expect(entries[1]).toMatchObject({
      date: 'September 2',
      fileUrl: 'https://en.wikipedia.org/wiki/File:Legacy_en.jpg',
    })
    expect(entries[1].imageUrl).toBe('https://upload.wikimedia.org/wikipedia/commons/2/2x/Legacy_en.jpg')
  })
})
