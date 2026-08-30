import { db } from '@/utils/db'

const GIST_FILENAME = 'qwerty-learner-sync.json'
const GIST_DESCRIPTION = 'Qwerty Learner Cloud Sync Data'

export type SyncData = {
  version: number
  syncTime: number
  indexedDB: Record<string, unknown>
  localStorage: Record<string, string>
}

export type SyncResult = {
  success: boolean
  gistId?: string
  syncTime?: number
  error?: string
}

const GITHUB_API = 'https://api.github.com'

/**
 * 导出全部数据（IndexedDB + localStorage）为 JSON 对象
 */
export async function exportAllData(): Promise<SyncData> {
  // 动态导入 dexie-export-import（代码分割到单独 chunk，需确保加载完成）
  const { exportDB } = await import('dexie-export-import')
  // 导出 IndexedDB
  const blob = await exportDB(db)
  const indexedDBJson = JSON.parse(await blob.text())

  // 导出 localStorage
  const localStorageData: Record<string, string> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      localStorageData[key] = localStorage.getItem(key) ?? ''
    }
  }

  return {
    version: 1,
    syncTime: Date.now(),
    indexedDB: indexedDBJson,
    localStorage: localStorageData,
  }
}

/**
 * 导入全部数据到本地（IndexedDB + localStorage）
 */
export async function importAllData(data: SyncData): Promise<void> {
  // 动态导入 dexie-export-import
  const { importInto } = await import('dexie-export-import')
  // 导入 IndexedDB
  const json = JSON.stringify(data.indexedDB)
  const blob = new Blob([json], { type: 'application/json' })
  await importInto(db, blob, {
    acceptVersionDiff: true,
    acceptMissingTables: true,
    acceptNameDiff: false,
    acceptChangedPrimaryKey: false,
    overwriteValues: true,
    clearTablesBeforeImport: true,
  })

  // 导入 localStorage（先清空再写入，避免残留）
  localStorage.clear()
  for (const [key, value] of Object.entries(data.localStorage)) {
    localStorage.setItem(key, value)
  }
}

/**
 * 验证 GitHub Token 是否有效
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * 创建新的私密 Gist 并上传数据
 */
async function createGist(token: string, data: SyncData): Promise<string> {
  const res = await fetch(`${GITHUB_API}/gists`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`创建 Gist 失败 (${res.status}): ${err}`)
  }

  const result = await res.json()
  return result.id as string
}

/**
 * 更新已有 Gist 的数据
 */
async function updateGist(token: string, gistId: string, data: SyncData): Promise<void> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`更新 Gist 失败 (${res.status}): ${err}`)
  }
}

/**
 * 从 Gist 获取数据
 */
async function getGistData(token: string, gistId: string): Promise<SyncData> {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`获取 Gist 失败 (${res.status}): ${err}`)
  }

  const gist = await res.json()
  const file = gist.files?.[GIST_FILENAME]
  if (!file?.content) {
    throw new Error('Gist 中未找到同步数据文件')
  }

  return JSON.parse(file.content) as SyncData
}

/**
 * 上传本地数据到云端（创建新 Gist 或更新已有 Gist）
 */
export async function uploadToCloud(token: string, existingGistId?: string): Promise<SyncResult> {
  try {
    const data = await exportAllData()

    let gistId: string
    if (existingGistId) {
      await updateGist(token, existingGistId, data)
      gistId = existingGistId
    } else {
      gistId = await createGist(token, data)
    }

    return {
      success: true,
      gistId,
      syncTime: data.syncTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 从云端下载数据并导入到本地
 */
export async function downloadFromCloud(token: string, gistId: string): Promise<SyncResult> {
  try {
    const data = await getGistData(token, gistId)
    await importAllData(data)

    return {
      success: true,
      gistId,
      syncTime: data.syncTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 获取云端数据的同步时间
 */
export async function getCloudSyncTime(token: string, gistId: string): Promise<number | null> {
  try {
    const data = await getGistData(token, gistId)
    return data.syncTime ?? null
  } catch {
    return null
  }
}

/**
 * 启动时自动同步：比较云端和本地的 syncTime，云端更新则下载导入
 * 返回是否执行了下载导入
 */
export async function autoSyncOnLoad(token: string, gistId: string): Promise<{ updated: boolean; error?: string }> {
  try {
    const cloudTime = await getCloudSyncTime(token, gistId)
    if (cloudTime === null) {
      return { updated: false, error: '无法获取云端数据' }
    }

    const localTimeStr = localStorage.getItem('qwerty-learner-cloud-last-sync')
    const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0

    if (cloudTime > localTime) {
      const result = await downloadFromCloud(token, gistId)
      if (result.success) {
        return { updated: true }
      }
      return { updated: false, error: result.error }
    }

    return { updated: false }
  } catch (error) {
    return {
      updated: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// 自动上传相关常量和防抖定时器
export const AUTO_UPLOAD_KEY = 'qwerty-learner-auto-upload'
let autoUploadTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 练习完成后自动上传到云端（带 3 秒防抖，避免连续完成章节时重复上传）
 */
export async function autoUploadOnFinish(): Promise<{ success: boolean; error?: string }> {
  const autoUpload = localStorage.getItem(AUTO_UPLOAD_KEY) === 'true'
  if (!autoUpload) {
    return { success: false }
  }

  const token = localStorage.getItem('qwerty-learner-cloud-token')
  const gistId = localStorage.getItem('qwerty-learner-cloud-gist-id')
  if (!token || !gistId) {
    return { success: false, error: '未配置 Token 或 Gist ID' }
  }

  // 防抖：3 秒内多次触发只执行最后一次
  if (autoUploadTimer) {
    clearTimeout(autoUploadTimer)
  }

  return new Promise((resolve) => {
    autoUploadTimer = setTimeout(async () => {
      try {
        const result = await uploadToCloud(token, gistId)
        if (result.success && result.syncTime) {
          const timeStr = new Date().toLocaleString('zh-CN')
          localStorage.setItem('qwerty-learner-cloud-last-sync', timeStr)
        }
        resolve({ success: result.success, error: result.error })
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }, 3000)
  })
}
