import { revalidatePath, revalidateTag } from 'next/cache'
import { limparCacheNotionLiveMemoria, TAG_CACHE_NOTION } from './fetch'

/** Limpa cache local + data cache do Next para as rotas do relatório. */
export function revalidarCacheNotionRelatorio(chaveRelatorio?: string): void {
  limparCacheNotionLiveMemoria()
  revalidateTag(TAG_CACHE_NOTION)

  const chave = chaveRelatorio?.trim() || process.env.REPORT_ACCESS_KEY?.trim()
  if (chave) {
    revalidatePath(`/r/${chave}`, 'layout')
  }
}
