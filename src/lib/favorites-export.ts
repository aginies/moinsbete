import { BookmarkType } from '@/generated/client'

export interface ExportBookmarkItem {
  type: BookmarkType
  title: string
  description: string
  url: string
  imageUrl: string | null
  favoritedAt: string
  meta: Record<string, unknown> | null
}

export interface ExportIdeaBookmark extends ExportBookmarkItem {
  type: 'IDEA'
  sourceTitle: string
  takeaway: string
  slug: string
}

export interface ExportRadioBookmark extends ExportBookmarkItem {
  type: 'RADIO_FRANCE'
  radio: string
  section: string
  audioUrl: string
}

export interface ExportCnrsBookmark extends ExportBookmarkItem {
  type: 'CNRS_NEWS'
  category: string
}

export interface ExportImageDuJourBookmark extends ExportBookmarkItem {
  type: 'IMAGE_DU_JOUR'
  fileUrl: string
  date: string
}

export interface ExportSaviezVousBookmark extends ExportBookmarkItem {
  type: 'SAVIEZ_VOUS'
  sourceUrl: string | null
  imageFilename: string | null
}

export interface ExportWikimediaBookmark extends ExportBookmarkItem {
  type: 'IMAGE_WIKIMEDIA'
  docid: string
  titre: string
  auteur: string
  link: string
  droits: string
}

export interface ExportWikiLovesBookmark extends ExportBookmarkItem {
  type: 'IMAGE_WIKILOVES'
  docid: string
  titre: string
  auteur: string
  link: string
  droits: string
}

export interface ExportPixabayBookmark extends ExportBookmarkItem {
  type: 'IMAGE_PIXABAY'
  pageURL: string
  author: string
  authorProfileUrl: string
  duration: number
  videoUrl: string
  tags: string
}

export interface ExportPortailLexicalBookmark extends ExportBookmarkItem {
  type: 'PORTAIL_LEXICAL'
  form: string
  pos: string
  full_pos: string
  ipa: string
}

export interface ExportPortailWikipediaBookmark extends ExportBookmarkItem {
  type: 'PORTAIL_WIKIPEDIA'
  extract: string
  pageUrl: string
}

export interface ExportProverbeBookmark extends ExportBookmarkItem {
  type: 'PROVERBE'
  signification: string
  source: string
  url: string
  wiktionnaireUrl: string
  etymologie: string
  definitions: string[]
}

export interface ExportNewsBookmark extends ExportBookmarkItem {
  type: 'NEWS'
  source: string
  category: string
  publishedAt: string
}

export interface ExportF1Bookmark extends ExportBookmarkItem {
  type: 'F1'
  section: string
  date: string
  content: string
  summary: string
}

export interface ExportCitationBookmark extends ExportBookmarkItem {
  type: 'CITATION'
  author: string
  source: string
  category: string
}

export type FavoriteExportItem =
  | ExportIdeaBookmark
  | ExportRadioBookmark
  | ExportCnrsBookmark
  | ExportImageDuJourBookmark
  | ExportSaviezVousBookmark
  | ExportWikimediaBookmark
  | ExportWikiLovesBookmark
  | ExportPixabayBookmark
  | ExportPortailLexicalBookmark
  | ExportPortailWikipediaBookmark
  | ExportProverbeBookmark
  | ExportNewsBookmark
  | ExportF1Bookmark
  | ExportCitationBookmark

const HTML_HEAD = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mes favoris — MoinsBête</title>
  <style>
    :root {
      --bg: #fafafa;
      --text: #1a1a2e;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --accent: #6366f1;
      --accent-text: #4f46e5;
      --muted: #64748b;
      --shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    html.dark {
      --bg: #0f172a;
      --text: #e2e8f0;
      --card-bg: #1e293b;
      --border: #334155;
      --accent: #818cf8;
      --accent-text: #a5b4fc;
      --muted: #94a3b8;
      --shadow: 0 1px 3px rgba(0,0,0,0.4);
    }
    @media (prefers-color-scheme: dark) {
      html:not(.light) {
        --bg: #0f172a;
        --text: #e2e8f0;
        --card-bg: #1e293b;
        --border: #334155;
        --accent: #818cf8;
        --accent-text: #a5b4fc;
        --muted: #94a3b8;
        --shadow: 0 1px 3px rgba(0,0,0,0.4);
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .header {
      max-width: 960px;
      margin: 0 auto;
      padding: 2rem 1.5rem 1rem;
      border-bottom: 2px solid var(--border);
    }
    .header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--accent);
    }
    .header .export-date {
      font-size: 0.875rem;
      color: var(--muted);
      margin-top: 0.25rem;
    }
    .tabs {
      max-width: 960px;
      margin: 0 auto;
      padding: 1rem 1.5rem 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      border-bottom: 2px solid var(--border);
      position: sticky;
      top: 0;
      background: var(--bg);
      z-index: 10;
    }
    .tab {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted);
      text-decoration: none;
      border-radius: 0.5rem 0.5rem 0 0;
      border: 1px solid transparent;
      border-bottom: none;
      white-space: nowrap;
    }
    .tab:hover {
      color: var(--accent);
      background: var(--card-bg);
    }
    .tab.active {
      color: var(--accent);
      background: var(--card-bg);
      border-color: var(--border);
    }
    .content {
      max-width: 960px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    .section {
      margin-bottom: 2rem;
      display: none;
    }
    .section.active {
      display: block;
    }
    .section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow);
    }
    .card h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .card h3 a {
      color: var(--accent-text);
      text-decoration: none;
    }
    .card h3 a:hover {
      text-decoration: underline;
    }
    .card .description {
      font-size: 0.875rem;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
    .card .meta {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 0.5rem;
    }
    .card .tag {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 9999px;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--muted);
      margin-right: 0.5rem;
    }
    .card img {
      max-width: 100%;
      border-radius: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .card .link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: var(--accent);
      text-decoration: none;
      margin-top: 0.5rem;
    }
    .card .link:hover {
      text-decoration: underline;
    }
    .empty {
      text-align: center;
      padding: 2rem;
      color: var(--muted);
    }
    .footer {
      max-width: 960px;
      margin: 2rem auto;
      padding: 1.5rem;
      text-align: center;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.875rem;
    }
    .footer a {
      color: var(--accent);
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 9999px;
      margin-left: 0.5rem;
      vertical-align: middle;
    }
    .badge-idea { background: #fef3c7; color: #92400e; }
    .badge-radio { background: #ede9fe; color: #5b21b6; }
    .badge-cnrs { background: #d1fae5; color: #065f46; }
    .badge-image { background: #fce7f3; color: #9d174d; }
    .badge-wiki { background: #dbeafe; color: #1e40af; }
    .badge-wikiloves { background: #e0e7ff; color: #3730a3; }
    .badge-pixabay { background: #fef9c3; color: #854d0e; }
    .badge-lexical { background: #ffedd5; color: #9a3412; }
    .badge-wikipedia { background: #e0e7ff; color: #3730a3; }
    .badge-proverbe { background: #d1fae5; color: #065f46; }
    .badge-news { background: #dbeafe; color: #1e40af; }
    .badge-f1 { background: #fce7f3; color: #9d174d; }
    .badge-citation { background: #ffedd5; color: #9a3412; }
    .badge-saviez { background: #dbeafe; color: #1e40af; }
    @media print {
      .tabs { position: static; }
      .section { display: block !important; }
      .card { break-inside: avoid; }
    }
    @media (max-width: 640px) {
      .header h1 { font-size: 1.25rem; }
      .content { padding: 1rem; }
      .card { padding: 1rem; }
    }
    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .theme-toggle {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--card-bg);
      color: var(--text);
      font-size: 1.125rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, border-color 0.2s;
    }
    .theme-toggle:hover {
      background: var(--bg);
      border-color: var(--accent);
    }
    @media (max-width: 640px) {
      .header-top { flex-direction: column; }
      .theme-toggle { align-self: flex-end; }
    }
  </style>
</head>
<body>
`

const TABS_ORDER = [
  'idees', 'saviez-vous', 'image-du-jour', 'image-wikimedia', 'image-wikiloves',
  'image-pixabay', 'portail-lexical', 'portail-wikipedia', 'proverbe',
  'cnrs-news', 'news', 'f1', 'citation', 'radio-france',
]

const TAB_LABELS: Record<string, string> = {
  'idees': 'Id\u00e9es',
  'saviez-vous': 'Saviez-vous ?',
  'image-du-jour': 'Image du jour',
  'image-wikimedia': 'Wikimedia',
  'image-wikiloves': 'Wiki Loves',
  'image-pixabay': 'Pixabay',
  'portail-lexical': 'Lexique',
  'portail-wikipedia': 'Portail Wikip\u00e9dia',
  'proverbe': 'Proverbes',
  'cnrs-news': 'CNRS',
  'news': 'NEWS',
  'f1': 'F1',
  'citation': 'Citations',
  'radio-france': 'Radio France',
}

const BADGE_CLASSES: Record<string, string> = {
  'IDEA': 'badge-idea',
  'RADIO_FRANCE': 'badge-radio',
  'CNRS_NEWS': 'badge-cnrs',
  'IMAGE_DU_JOUR': 'badge-image',
  'SAVIEZ_VOUS': 'badge-saviez',
  'IMAGE_WIKIMEDIA': 'badge-wiki',
  'IMAGE_WIKILOVES': 'badge-wikiloves',
  'IMAGE_PIXABAY': 'badge-pixabay',
  'PORTAIL_LEXICAL': 'badge-lexical',
  'PORTAIL_WIKIPEDIA': 'badge-wikipedia',
  'PROVERBE': 'badge-proverbe',
  'NEWS': 'badge-news',
  'F1': 'badge-f1',
  'CITATION': 'badge-citation',
}

const TYPE_TO_TAB: Record<string, string> = {
  'IDEA': 'idees',
  'RADIO_FRANCE': 'radio-france',
  'CNRS_NEWS': 'cnrs-news',
  'IMAGE_DU_JOUR': 'image-du-jour',
  'SAVIEZ_VOUS': 'saviez-vous',
  'IMAGE_WIKIMEDIA': 'image-wikimedia',
  'IMAGE_WIKILOVES': 'image-wikiloves',
  'IMAGE_PIXABAY': 'image-pixabay',
  'PORTAIL_LEXICAL': 'portail-lexical',
  'PORTAIL_WIKIPEDIA': 'portail-wikipedia',
  'PROVERBE': 'proverbe',
  'NEWS': 'news',
  'F1': 'f1',
  'CITATION': 'citation',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatRelativeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function buildCardHtml(item: ExportBookmarkItem): string {
  const badgeClass = BADGE_CLASSES[item.type] || ''
  const badge = badgeClass ? `<span class="badge ${badgeClass}">${escapeHtml(item.type)}</span>` : ''
  let html = `<div class="card">\n`
  html += `  <h3>${escapeHtml(item.title)} ${badge}</h3>\n`

  if (item.imageUrl) {
    html += `  <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy">\n`
  }

  if (item.description) {
    html += `  <p class="description">${escapeHtml(item.description)}</p>\n`
  }

  if (item.url) {
    html += `  <a class="link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Voir l&apos;original &nearr;</a>\n`
  }

  html += `  <p class="meta">Favori le ${formatDate(item.favoritedAt)}</p>\n`
  html += `</div>\n`
  return html
}

function buildSectionHtml(tabId: string, label: string, items: ExportBookmarkItem[]): string {
  if (items.length === 0) {
    return `<div class="section" id="${tabId}"><h2>${escapeHtml(label)}</h2><p class="empty">Aucun favori dans cette cat\u00e9gorie</p></div>\n`
  }
  let html = `<div class="section" id="${tabId}"><h2>${escapeHtml(label)}</h2>\n`
  for (const item of items) {
    html += buildCardHtml(item)
  }
  html += `</div>\n`
  return html
}

export function exportFavoritesToHtml(items: ExportBookmarkItem[], exportDate: Date): string {
  const tabItems: Record<string, ExportBookmarkItem[]> = {}
  for (const tab of TABS_ORDER) {
    tabItems[tab] = []
  }
  for (const item of items) {
    const tab = TYPE_TO_TAB[item.type]
    if (tab) {
      tabItems[tab].push(item)
    }
  }

  let tabsHtml = '<div class="tabs">\n'
  for (const tab of TABS_ORDER) {
    const label = TAB_LABELS[tab] || tab
    const count = tabItems[tab]?.length || 0
    if (count > 0) {
      tabsHtml += `  <a href="#${tab}" class="tab">${escapeHtml(label)} (${count})</a>\n`
    }
  }
  tabsHtml += '</div>\n'

  let sectionsHtml = ''
  for (const tab of TABS_ORDER) {
    const label = TAB_LABELS[tab] || tab
    const count = tabItems[tab]?.length || 0
    if (count > 0) {
      sectionsHtml += buildSectionHtml(tab, label, tabItems[tab])
    }
  }

  const formattedDate = exportDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${HTML_HEAD}
  <div class="header">
    <div class="header-top">
      <div>
        <h1>Mes favoris — MoinsB\u00eate</h1>
        <p class="export-date">Export\u00e9 le ${escapeHtml(formattedDate)}</p>
      </div>
      <button id="theme-toggle" class="theme-toggle" aria-label="Changer le thème" title="Changer le thème"></button>
    </div>
  </div>
  ${tabsHtml}
  <div class="content">
${sectionsHtml}
  </div>
  <div class="footer">
    <p>Export\u00e9 depuis <a href="https://moinsbete.guibo.com" target="_blank" rel="noopener noreferrer">MoinsB\u00eate</a></p>
    <p style="margin-top: 0.5rem;">Remplacez le scroll infini par l&apos;apprentissage rapide</p>
  </div>
  <script>
    (function(){
      var tabs = document.querySelectorAll('.tab');
      var sections = document.querySelectorAll('.section');
      if(!tabs.length || !sections.length) return;
      var firstTab = tabs[0];
      var firstSection = sections[0];
      if(firstTab) firstTab.classList.add('active');
      if(firstSection) firstSection.classList.add('active');
      tabs.forEach(function(tab){
        tab.addEventListener('click', function(e){
          e.preventDefault();
          tabs.forEach(function(t){ t.classList.remove('active'); });
          sections.forEach(function(s){ s.classList.remove('active'); });
          tab.classList.add('active');
          var target = document.getElementById(tab.getAttribute('href').slice(1));
          if(target) target.classList.add('active');
          history.pushState(null, '', tab.getAttribute('href'));
        });
      });
      if(location.hash){
        var target = document.getElementById(location.hash.slice(1));
        if(target){
          sections.forEach(function(s){ s.classList.remove('active'); });
          target.classList.add('active');
          tabs.forEach(function(t){ t.classList.remove('active'); });
          var matchingTab = document.querySelector('a.tab[href="'+location.hash+'"]');
          if(matchingTab) matchingTab.classList.add('active');
        }
      }
      var html = document.documentElement;
      var saved = localStorage.getItem('export-theme');
      var btn = document.getElementById('theme-toggle');
      var icon = '\uD83C\uDF1E';
      if(saved === 'dark'){
        html.classList.add('dark');
        icon = '\uD83C\uDF19';
      } else if(saved === 'light'){
        html.classList.add('light');
        icon = '\uD83C\uDF1E';
      } else if(!window.matchMedia('(prefers-color-scheme: dark)').matches){
        html.classList.add('light');
        icon = '\uD83C\uDF1E';
      } else {
        html.classList.add('dark');
        icon = '\uD83C\uDF19';
      }
      btn.textContent = icon;
      btn.addEventListener('click', function(){
        var isDark = html.classList.contains('dark');
        if(isDark){
          html.classList.remove('dark');
          html.classList.add('light');
          localStorage.setItem('export-theme', 'light');
          btn.textContent = '\uD83C\uDF1E';
        } else {
          html.classList.remove('light');
          html.classList.add('dark');
          localStorage.setItem('export-theme', 'dark');
          btn.textContent = '\uD83C\uDF19';
        }
      });
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e){
        if(!localStorage.getItem('export-theme')){
          if(e.matches){
            html.classList.remove('light');
            html.classList.add('dark');
            btn.textContent = '\uD83C\uDF19';
          } else {
            html.classList.remove('dark');
            html.classList.add('light');
            btn.textContent = '\uD83C\uDF1E';
          }
        }
      });
    })();
  </script>
</body>
</html>`
}
