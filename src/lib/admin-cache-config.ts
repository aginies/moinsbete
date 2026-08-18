export interface CacheSourceConfig {
  key: string
  model: string
  statsArticles: string
  statsExpired: string
  statsScrapedAt: string
}

export const CACHE_SOURCES: CacheSourceConfig[] = [
  { key: 'cnrs', model: 'CachedCnrsArticle', statsArticles: 'cnrsArticles', statsExpired: 'cnrsExpired', statsScrapedAt: 'cnrsScrapedAt' },
  { key: 'radio', model: 'CachedRadioEpisode', statsArticles: 'radioEpisodes', statsExpired: 'radioExpired', statsScrapedAt: 'radioScrapedAt' },
  { key: 'news', model: 'CachedNewsArticle', statsArticles: 'newsArticles', statsExpired: 'newsExpired', statsScrapedAt: 'newsScrapedAt' },
  { key: 'f1', model: 'CachedF1Article', statsArticles: 'f1Articles', statsExpired: 'f1Expired', statsScrapedAt: 'f1ScrapedAt' },
  { key: 'wiki', model: 'CachedWikipediaImage', statsArticles: 'wikiImages', statsExpired: 'wikiImageExpired', statsScrapedAt: 'wikiScrapedAt' },
  { key: 'wikiloves', model: 'CachedWikiLovesImage', statsArticles: 'wikiLovesImages', statsExpired: 'wikiLovesExpired', statsScrapedAt: 'wikiLovesScrapedAt' },
  { key: 'portailWiki', model: 'CachedWikipediaPortalArticle', statsArticles: 'portailWikipediaArticles', statsExpired: 'portailWikipediaExpired', statsScrapedAt: 'portailWikipediaScrapedAt' },
  { key: 'citation', model: 'CachedCitationArticle', statsArticles: 'citationArticles', statsExpired: 'citationExpired', statsScrapedAt: 'citationScrapedAt' },
  { key: 'insolite', model: 'CachedInsoliteArticle', statsArticles: 'insoliteArticles', statsExpired: 'insoliteExpired', statsScrapedAt: 'insoliteScrapedAt' },
  { key: 'apod', model: 'CachedApodImage', statsArticles: 'apodImages', statsExpired: 'apodExpired', statsScrapedAt: 'apodScrapedAt' },
  { key: 'airCrash', model: 'CachedAirCrashArticle', statsArticles: 'airCrashArticles', statsExpired: 'airCrashExpired', statsScrapedAt: 'airCrashScrapedAt' },
]
