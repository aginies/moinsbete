import { describe, it, expect } from 'vitest'
import {
  parseAsnSearchResults,
  parseAsnDate,
  scoreAsnRow,
  pickBestAsnRow,
  asnUrlFor,
  isAsnNoOccurrence,
  AsnRecord,
  AsnMatchWanted,
} from '@/lib/asn-fetch'

const SAMPLE_HTML = `
<table class="list"><tr><th class="list">date</th></tr>
<tr><td class="list"><nobr><a href="/wikibase/526423">6 Jan 2009</a></nobr></td><td class="list"><NOBR>Airbus A330-302</NOBR></td>
<td class="list">A7-AEA</td>
<td class="list">Qatar Airways</td>
<td class="listdata">0</td>
<td class="list">Paris-Charles de Gaulle Airport (CDG/LFPG)</td>
<td class="list">non</td>
</tr>
<tr><td class="list"><nobr><a href="/wikibase/321502">1 Jun 2009</a></nobr></td><td class="list"><NOBR>Airbus A330-203</NOBR></td>
<td class="list">F-GZCP</td>
<td class="list">Air France</td>
<td class="listdata">228</td>
<td class="list">c 160km NNW off S&atilde;o Pedro and S&atilde;o Paulo Archipelago</td>
<td class="list">w/o</td>
</tr>
</table>`

describe('parseAsnSearchResults', () => {
  it('parses rows with all fields', () => {
    const rows = parseAsnSearchResults(SAMPLE_HTML)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      id: '526423',
      date: '6 Jan 2009',
      type: 'Airbus A330-302',
      registration: 'A7-AEA',
      operator: 'Qatar Airways',
      fatalities: 0,
      location: 'Paris-Charles de Gaulle Airport (CDG/LFPG)',
      damage: 'non',
    })
    expect(rows[1].id).toBe('321502')
    expect(rows[1].fatalities).toBe(228)
    expect(rows[1].damage).toBe('w/o')
  })

  it('returns empty array for zero-result page', () => {
    expect(parseAsnSearchResults('<div>no occurrences in the database</div>')).toEqual([])
  })
})

describe('isAsnNoOccurrence', () => {
  it('detects zero-result page', () => {
    expect(isAsnNoOccurrence('<span>no occurrences in the database</span>')).toBe(true)
  })
  it('false on normal page', () => {
    expect(isAsnNoOccurrence(SAMPLE_HTML)).toBe(false)
  })
})

describe('parseAsnDate', () => {
  it('parses "1 Jun 2009"', () => {
    expect(parseAsnDate('1 Jun 2009')).toEqual({ day: 1, month: 6, year: 2009 })
  })
  it('parses "23 Jul 1983"', () => {
    expect(parseAsnDate('23 Jul 1983')).toEqual({ day: 23, month: 7, year: 1983 })
  })
  it('parses "31 Dec 1972"', () => {
    expect(parseAsnDate('31 Dec 1972')).toEqual({ day: 31, month: 12, year: 1972 })
  })
  it('returns null on garbage', () => {
    expect(parseAsnDate('unknown')).toBeNull()
    expect(parseAsnDate('')).toBeNull()
  })
})

const row = (over: Partial<AsnRecord>): AsnRecord => ({
  id: '1', date: '23 Jul 1983', type: 'Boeing 767-233', registration: 'C-GAUN',
  operator: 'Air Canada', fatalities: 0, location: 'Gimli', damage: 'sub', ...over,
})

const wanted: AsnMatchWanted = {
  date: { day: 23, month: 7, year: 1983 },
  reg: 'C-GAUN',
  type: 'Boeing 767-233',
  operator: 'Air Canada',
}

describe('scoreAsnRow', () => {
  it('scores full match 80', () => {
    expect(scoreAsnRow(row({}), wanted)).toBe(80)
  })
  it('scores date only 40', () => {
    expect(scoreAsnRow(row({ type: 'Airbus A320', registration: 'F-ABC', operator: 'Other' }), wanted)).toBe(40)
  })
  it('scores reg+type+operator without date (40, but rejected by picker)', () => {
    expect(scoreAsnRow(row({ date: '24 Jul 1983' }), wanted)).toBe(40)
  })
})

describe('pickBestAsnRow', () => {
  it('picks the date-matching row', () => {
    const rows = [
      row({ id: 'wrong', date: '1 Jan 1983', type: 'Boeing 767-233', registration: 'C-XYZ', operator: 'Air Canada' }),
      row({ id: 'right' }),
    ]
    expect(pickBestAsnRow(rows, wanted)?.id).toBe('right')
  })

  it('returns null when no date match', () => {
    const rows = [row({ date: '1 Jan 1983' })]
    expect(pickBestAsnRow(rows, wanted)).toBeNull()
  })

  it('returns null on empty rows', () => {
    expect(pickBestAsnRow([], wanted)).toBeNull()
  })

  it('returns null when wanted date is null', () => {
    expect(pickBestAsnRow([row({})], { ...wanted, date: null })).toBeNull()
  })

  it('accepts reg+type match with date', () => {
    const rows = [row({ id: 'x', registration: 'C-OTHER', type: 'Boeing 767-233' })]
    const w = { ...wanted, reg: 'C-GAUN' }
    expect(pickBestAsnRow(rows, w)?.id).toBe('x')
  })
})

describe('asnUrlFor', () => {
  it('builds the wikibase URL', () => {
    expect(asnUrlFor('321502')).toBe('https://aviation-safety.net/wikibase/321502')
  })
})
