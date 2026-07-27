'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Newspaper, Image as ImageIcon, Trophy, Star, Globe } from 'lucide-react'
import Link from 'next/link'
import { sanitizeUrl } from '@/lib/utils'

interface F1Article {
  id: string
  title: string
  description: string | null
  content: string | null
  url: string
  imageUrl: string | null
  section: string
  meta: unknown
  scrapedAt: Date
}

interface F1PageClientProps {
  actualites: F1Article[]
  image: F1Article | null
  classement: F1Article[]
  saviez: F1Article[]
  fia: F1Article[]
}

const TABS = [
  { key: 'image', label: 'Image du jour', icon: ImageIcon },
  { key: 'actualites', label: 'Actualités Wikipedia', icon: Newspaper },
  { key: 'fia', label: 'FIA F1 NEWS', icon: Globe },
  { key: 'classement', label: 'Classement', icon: Trophy },
  { key: 'saviez', label: 'Le saviez-vous ?', icon: Star },
]

export function F1PageClient({ actualites, image, classement, saviez, fia }: F1PageClientProps) {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-red-900 dark:text-red-100">Formule 1</h1>
        <p className="text-sm text-muted-foreground mt-1">Actualités, classements et infos sur la Formule 1</p>
      </div>
      
      <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {TABS.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-4 min-h-[400px]">
            <TabsContent value="image" className="mt-0">
              {image ? (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-red-200 dark:border-red-800">
                    <img
                      src={sanitizeUrl(image.imageUrl || '', '')}
                      alt={image.title}
                      className="w-full h-96 object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">{image.title}</h2>
                    <Link
                      href={sanitizeUrl(image.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-600 hover:underline"
                    >
                      Voir l'article →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune image disponible</p>
              )}
            </TabsContent>

            <TabsContent value="actualites" className="mt-0">
              {actualites.length > 0 ? (
                <div className="space-y-4">
                  {actualites.map(article => (
                    <div key={article.id} className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-white/50 dark:bg-black/20">
                      <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">{article.title}</h2>
                      {article.description && (
                        <p className="text-xs text-red-500 dark:text-red-400 mb-2">{article.description}</p>
                      )}
                      {article.content && (
                        <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed line-clamp-3 mb-3">
                          {article.content}
                        </p>
                      )}
                      <Link
                        href={sanitizeUrl(article.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-red-600 hover:underline"
                      >
                        Lire l'article →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune actualité disponible</p>
              )}
            </TabsContent>

            <TabsContent value="fia" className="mt-0">
              {fia.length > 0 ? (
                <div className="space-y-4">
                  {fia.map(article => (
                    <div key={article.id} className="flex gap-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-white/50 dark:bg-black/20">
                      {article.imageUrl && (
                        <div className="flex-shrink-0 w-48">
                          <Link
                            href={sanitizeUrl(article.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={sanitizeUrl(article.imageUrl, '')}
                              alt={article.title}
                              loading="lazy"
                              className="w-full h-32 object-cover rounded transition-opacity hover:opacity-90"
                            />
                          </Link>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2 line-clamp-2">
                          <Link
                            href={sanitizeUrl(article.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {article.title}
                          </Link>
                        </h2>
                        {article.description && (
                          <p className="text-xs text-red-500 dark:text-red-400 mb-2">{article.description}</p>
                        )}
                        {article.content && (
                          <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed line-clamp-3 mb-3">
                            {article.content}
                          </p>
                        )}
                        <Link
                          href={sanitizeUrl(article.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-red-600 hover:underline"
                        >
                          Lire sur FIA.com →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune actualité FIA disponible</p>
              )}
            </TabsContent>

            <TabsContent value="classement" className="mt-0">
              {classement.length > 0 ? (
                <div className="space-y-6">
                  {classement.map(article => {
                    const rows = (article.meta as any[]) || []
                    const isPilotes = article.title?.includes('Pilotes')
                    return (
                      <div key={article.id} className="rounded-lg border border-red-200 dark:border-red-800 overflow-hidden">
                        <div className="bg-red-100 dark:bg-red-900/40 px-4 py-3 font-semibold text-red-900 dark:text-red-100">
                          {isPilotes ? 'Classement Pilotes' : 'Classement Constructeurs'}
                        </div>
                        <table className="w-full">
                          <thead className="bg-red-50 dark:bg-red-950/20">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-red-700 dark:text-red-300">Pos</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-red-700 dark:text-red-300">Nom</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-red-700 dark:text-red-300">Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => (
                              <tr key={i} className="border-t border-red-200 dark:border-red-800">
                                <td className="px-4 py-2 text-sm text-red-900 dark:text-red-100">{row.pos}</td>
                                <td className="px-4 py-2 text-sm text-red-900 dark:text-red-100">{row.name}</td>
                                <td className="px-4 py-2 text-sm text-red-900 dark:text-red-100 text-right">{row.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun classement disponible</p>
              )}
            </TabsContent>

            <TabsContent value="saviez" className="mt-0">
              {saviez.length > 0 ? (
                <div className="space-y-4">
                  {saviez.map(article => (
                    <div key={article.id} className="p-4 rounded-lg bg-white/50 dark:bg-black/20 border border-red-100 dark:border-red-900/30">
                      <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">{article.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune information disponible</p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
  )
}
