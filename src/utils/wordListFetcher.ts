import type { Word } from '@/typings'

export async function wordListFetcher(url: string): Promise<Word[]> {
  // url 已在 dictionary.ts 中通过 import.meta.env.BASE_URL 拼接完整路径，此处直接请求
  const response = await fetch(url)
  const words: Word[] = await response.json()
  return words
}
