import { describe, it, expect } from 'vitest'
import {
  parseAirCrashInfobox,
  parseFrenchDate,
  parseFrenchDates,
  stripWikiLinks,
  modelToken,
  fallbackAircraftType,
} from '@/lib/wiki-infobox'

const STANDARD = `{{Infobox Accident de transport
 | nom                   = Vol Avianca 052
 | image                 = CrashAVA052.jpg
 | date                  = {{date|25|janvier|1990|en aéronautique}}
 | phase                 = Atterrissage
 | type                  = Panne de carburant
 | appareil              = [[Boeing 707|Boeing 707-321B]]
 | compagnie             = [[Avianca]]
 | numéro_identification = HK-2016
 | passagers             = 149
}}

Le {{date|25 janvier 1990}}, le [[Boeing 707]] assurant le vol Avianca 052...`

const ATTENTAT = `{{Infobox Attentat |  | titre = Vol Metrojet 9268 |  | localisation = Sinaï |  | cible = [[Airbus A321|Airbus A321-231]] |  | date = {{date|4|novembre|2015|en aéronautique}} }}

Corps du texte.`

describe('stripWikiLinks', () => {
  it('resolves [[A|B]] to B', () => {
    expect(stripWikiLinks('[[Boeing 707|Boeing 707-321B]]')).toBe('Boeing 707-321B')
  })
  it('resolves [[A]] to A', () => {
    expect(stripWikiLinks('[[Avianca]]')).toBe('Avianca')
  })
  it('removes <br/>', () => {
    expect(stripWikiLinks('a<br/>b')).toBe('a b')
  })
})

describe('parseFrenchDate', () => {
  it('parses {{date|d|m|y}}', () => {
    expect(parseFrenchDate('{{date|25|janvier|1990|en aéronautique}}')).toEqual({ day: 25, month: 1, year: 1990 })
  })
  it('parses capital {{Date|...}}', () => {
    expect(parseFrenchDate('{{Date|23|février|2008|en aéronautique}}')).toEqual({ day: 23, month: 2, year: 2008 })
  })
  it('parses single-param {{date|d m y}}', () => {
    expect(parseFrenchDate('{{date|26 janvier 2020|en aéronautique}}')).toEqual({ day: 26, month: 1, year: 2020 })
  })
  it('parses plain date', () => {
    expect(parseFrenchDate('16 juillet 1999')).toEqual({ day: 16, month: 7, year: 1999 })
  })
  it('takes first date of a range', () => {
    expect(parseFrenchDate('{{date|24|décembre-|1994-}} au {{date|26|décembre|1994}}')).toEqual({ day: 24, month: 12, year: 1994 })
  })
  it('returns null on garbage', () => {
    expect(parseFrenchDate('inconnu')).toBeNull()
  })
  it('parses numeric month {{date|1|6|2009}}', () => {
    expect(parseFrenchDate('{{date|1|6|2009|en aéronautique}}')).toEqual({ day: 1, month: 6, year: 2009 })
  })
  it('parses {{Date-|31 juillet 1992}}', () => {
    expect(parseFrenchDate('{{Date-|31 juillet 1992}}')).toEqual({ day: 31, month: 7, year: 1992 })
  })
  it('parses ISO {{Date|2018-03-12}}', () => {
    expect(parseFrenchDate('{{Date|2018-03-12|en aéronautique}}')).toEqual({ day: 12, month: 3, year: 2018 })
  })
  it('parses wiki-linked plain date', () => {
    expect(parseFrenchDate('[[Attentats du 11 septembre 2001|11 septembre 2001]]')).toEqual({ day: 11, month: 9, year: 2001 })
  })
})

describe('parseFrenchDates', () => {
  it('returns both dates of a range', () => {
    expect(parseFrenchDates('{{date|24|décembre-|1994-}} au {{date|26|décembre|1994}}')).toEqual([
      { day: 24, month: 12, year: 1994 },
      { day: 26, month: 12, year: 1994 },
    ])
  })
  it('returns single date without range', () => {
    expect(parseFrenchDates('{{date|25|janvier|1990|en aéronautique}}')).toHaveLength(1)
  })
})

describe('parseAirCrashInfobox', () => {
  it('parses standard infobox', () => {
    const r = parseAirCrashInfobox(STANDARD)
    expect(r.dates).toEqual([{ day: 25, month: 1, year: 1990 }])
    expect(r.type).toBe('Boeing 707-321B')
    expect(r.reg).toBe('HK-2016')
    expect(r.operator).toBe('Avianca')
  })

  it('parses Infobox Attentat with cible', () => {
    const r = parseAirCrashInfobox(ATTENTAT)
    expect(r.dates).toEqual([{ day: 4, month: 11, year: 2015 }])
    expect(r.type).toBe('Airbus A321-231')
  })

  it('handles missing infobox', () => {
    const r = parseAirCrashInfobox('Pas d\'infobox ici, juste du texte.')
    expect(r).toEqual({ dates: [], type: null, reg: null, operator: null })
  })

  it('falls back to text for type when no appareil field', () => {
    const wt = `{{Infobox Attentat | date = {{date|21|décembre|1988}} }}
Le [[Boeing 747]] de [[Pan Am]] s'est écrasé.`
    const r = parseAirCrashInfobox(wt)
    expect(r.dates).toEqual([{ day: 21, month: 12, year: 1988 }])
    expect(r.type).toBe('Boeing 747')
  })

  it('derives operator from title when no compagnie', () => {
    const wt = `{{Infobox Attentat | date = {{date|11|décembre|1994}} }}
Vol Philippine Airlines 434.`
    const r = parseAirCrashInfobox(wt, 'Vol Philippine Airlines 434')
    expect(r.operator).toBe('Philippine Airlines')
  })
})

describe('fallbackAircraftType', () => {
  it('finds type in head text', () => {
    expect(fallbackAircraftType('xxx [[Tupolev Tu-154]] yyy')).toBe('Tupolev Tu-154')
  })
  it('returns null when absent', () => {
    expect(fallbackAircraftType('aucun avion mentionné ici')).toBeNull()
  })
})

describe('modelToken', () => {
  it('extracts 767-233 from Boeing 767-233', () => {
    expect(modelToken('Boeing 767-233')).toBe('767-233')
  })
  it('extracts A330-203 from Airbus A330-203', () => {
    expect(modelToken('Airbus A330-203')).toBe('A330-203')
  })
  it('extracts MD-83 from McDonnell Douglas MD-83', () => {
    expect(modelToken('McDonnell Douglas MD-83')).toBe('MD-83')
  })
  it('extracts DHC-6-300 from De Havilland Canada DHC-6-300 Twin Otter', () => {
    expect(modelToken('De Havilland Canada DHC-6-300 Twin Otter')).toBe('DHC-6-300')
  })
  it('handles no-digit types (Comet 1)', () => {
    expect(modelToken('De Havilland Comet 1')).toBe('Comet 1')
  })
})
