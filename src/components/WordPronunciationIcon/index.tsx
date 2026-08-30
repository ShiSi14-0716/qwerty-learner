import { SoundIcon } from './SoundIcon'
import usePronunciationSound from '@/hooks/usePronunciation'
import type { Word } from '@/typings'
import { useCallback, useEffect, useImperativeHandle } from 'react'
import React from 'react'

export const WordPronunciationIcon = React.forwardRef<
  WordPronunciationIconRef,
  { word: Word; lang: string; className?: string; iconClassName?: string }
>(({ word, lang, className, iconClassName }, ref) => {
  // 从 notation 中提取假名注音（格式：汉字(假名)），用于日语发音
  const extractKanaFromNotation = (notation: string): string => {
    if (!notation) return ''
    const match = notation.match(/\(([^)]+)\)/)
    if (match) return match[1]
    // 没有括号时，notation 本身可能就是假名或外来语
    return notation
  }

  const currentWord = () => {
    if (lang === 'hapin') {
      if (/[\u0400-\u04FF]/.test(word.notation || '')) {
        // 哈萨克语西里尔文字
        return word.notation || ''
      } else {
        // 哈萨克语老文字
        return word.trans[2]
      }
    } else if (lang === 'romaji' || lang === 'ja') {
      // 日语：直接用假名注音发音，避免罗马音转换函数的 bug（拨音 nn 等）
      const kana = extractKanaFromNotation(word.notation || '')
      return kana || word.name
    } else {
      return word.name
    }
  }
  const { play, stop, isPlaying } = usePronunciationSound(currentWord())

  const playSound = useCallback(() => {
    stop()
    play()
  }, [play, stop])

  useEffect(() => {
    return stop
  }, [word, stop])

  useImperativeHandle(
    ref,
    () => ({
      play: playSound,
    }),
    [playSound],
  )

  return (
    <SoundIcon
      animated={isPlaying}
      onClick={playSound}
      className={`cursor-pointer text-gray-600 ${className}`}
      iconClassName={iconClassName}
    />
  )
})

WordPronunciationIcon.displayName = 'WordPronunciationIcon'

export type WordPronunciationIconRef = {
  play: () => void
}
