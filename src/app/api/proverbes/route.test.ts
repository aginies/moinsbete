import { describe, it, expect } from 'vitest'

function cleanWikitext(text: string): string {
  if (!text) return ''
  
  let cleaned = text.replace(/<[^>]*>/g, ' ')
  
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, (_, p1) => {
    if (p1.includes('|')) {
      return p1.split('|')[1].trim()
    }
    return p1.trim()
  })
  
  cleaned = cleaned.replace(/\{\{([^}]+)\}\}/g, (_, p1) => {
    const parts = p1.split('|')
    const name = parts[0].toLowerCase().trim()
    
    if (name === 'lang' || name === 'langue') {
      return parts[2]?.replace(/\}\}/, '').trim()
    }
    if (name === 'siècle') {
      return parts[2]?.replace(/\}\}/, '').trim()
    }
    if (name === 'ébauche-étym') {
      return 'Ébauche'
    }
    if (name === 'figuré' || name === 'fig') {
      return '(Figuré)'
    }
    if (name === 'familier' || name === 'fam') {
      return '(Familier)'
    }
    if (name === 'populaire' || name === 'pop') {
      return '(Populaire)'
    }
    if (name === 'littéraire' || name === 'lit') {
      return '(Littéraire)'
    }
    if (name === 'prov' || name === 'proverbe') {
      return '(Proverbe)'
    }
    if (name === 'cf' || name === 'voir') {
      return parts[1] ? `(cf. ${parts[1].trim()})` : ''
    }
    if (parts.length === 1) {
      return `(${parts[0].trim()})`
    }
    if (parts[1] === 'fr' || parts[parts.length - 1] === 'fr') {
      return `(${parts[0].trim()})`
    }
    return ''
  })

  cleaned = cleaned.replace(/'''/g, '').replace(/''/g, '')

  return cleaned.replace(/\s+/g, ' ').trim()
}

function parseEtymology(content: string): string | undefined {
  const etymMatch = content.match(/===\s*\{\{S\|étymologie\}\}\s*===(.+?)(?=\s*===)/s)
  if (etymMatch) {
    let etym = etymMatch[1].trim()
    etym = etym.replace(/^:\s*/, '')
    etym = etym.replace(/\{\{ébauche-étym\|fr\}\}/g, '')
    if (etym.trim()) {
      return cleanWikitext(etym)
    }
  }
  return undefined
}

function parseDefinitions(content: string): string[] {
  const frenchSectionMatch = content.match(/==\s*\{\{langue\|fr\}\}\s*==([\s\S]*?)(?=\n==[^=]|$)/)
  if (frenchSectionMatch) {
    const frenchSection = frenchSectionMatch[1]
    const defMatches = frenchSection.match(/^#\s+(.+)$/gm)
    if (defMatches && defMatches.length > 0) {
      return defMatches.map((d: string) => cleanWikitext(d.replace(/^#\s+/, ''))).filter(Boolean)
    }
  }
  return []
}

// Debug helper
function debugParseDefinitions(content: string): { match: boolean; section: string; defs: string[] } {
  const frenchSectionMatch = content.match(/==\s*\{\{langue\|fr\}\}\s*==([\s\S]*?)(?=^==[^=]|$)/m)
  const section = frenchSectionMatch?.[1] || ''
  const defMatches = section.match(/^#\s+(.+)$/gm)
  const defs = defMatches?.map((d: string) => cleanWikitext(d.replace(/^#\s+/, ''))).filter(Boolean) || []
  return { match: !!frenchSectionMatch, section: section.slice(0, 100), defs }
}

describe('parseEtymology', () => {
  it('returns undefined when no etymology section', () => {
    const content = '== {{langue|fr}} ==\n=== {{S|locution-phrase|fr}} ===\ntext'
    expect(parseEtymology(content)).toBeUndefined()
  })

  it('returns undefined when only ébauche-étym', () => {
    const content = `== {{langue|fr}} ==
=== {{S|étymologie}} ===
: {{ébauche-étym|fr}}

=== {{S|locution-phrase|fr}} ===
text`
    expect(parseEtymology(content)).toBeUndefined()
  })

  it('returns undefined when etymology is empty after cleanup', () => {
    const content = `== {{langue|fr}} ==
=== {{S|étymologie}} ===
: 

=== {{S|locution-phrase|fr}} ===
text`
    expect(parseEtymology(content)).toBeUndefined()
  })

  it('returns cleaned etymology when real content exists', () => {
    const content = `== {{langue|fr}} ==
=== {{S|étymologie}} ===
: Du latin barca, bateau, et desperatus, désespéré.

=== {{S|locution-phrase|fr}} ===
text`
    const result = parseEtymology(content)
    expect(result).toBeDefined()
    expect(result).toContain('latin')
    expect(result).toContain('barca')
  })

  it('handles etymology with multiple lines', () => {
    const content = `== {{langue|fr}} ==
=== {{S|étymologie}} ===
: Première attestation au XVIe siècle.
: Issu du latin barca.

=== {{S|locution-phrase|fr}} ===
text`
    const result = parseEtymology(content)
    expect(result).toBeDefined()
    expect(result).toContain('XVIe')
    expect(result).toContain('latin')
  })
})

describe('parseDefinitions', () => {
  it('returns empty array when no French section', () => {
    const content = '== {{langue|es}} ==\ntext'
    expect(parseDefinitions(content)).toEqual([])
  })

  it('returns definitions from French section', () => {
    const content = `== {{langue|fr}} ==
=== {{S|locution-phrase|fr}} ===
'''proverbe'''
# Première définition ici.
#* {{exemple|lang=fr}}
# Deuxième définition.

=== {{S|références}} ===
text`
    const defs = parseDefinitions(content)
    expect(defs).toHaveLength(2)
    expect(defs[0]).toContain('Première définition')
    expect(defs[1]).toContain('Deuxième définition')
  })

  it('returns empty array when no definitions', () => {
    const content = `== {{langue|fr}} ==
=== {{S|locution-phrase|fr}} ===
'''proverbe'''

=== {{S|références}} ===
text`
    expect(parseDefinitions(content)).toEqual([])
  })

  it('excludes definitions from other sections', () => {
    const content = `== {{langue|fr}} ==
=== {{S|locution-phrase|fr}} ===
'''proverbe'''
# Definition principale.

== {{langue|es}} ==
# Definition espagnole.`
    const defs = parseDefinitions(content)
    expect(defs).toHaveLength(1)
    expect(defs[0]).toContain('Definition principale')
  })
})
