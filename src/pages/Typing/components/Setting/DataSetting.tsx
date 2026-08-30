import styles from './index.module.css'
import type { ExportProgress, ImportProgress } from '@/utils/db/data-export'
import { exportDatabase, importDatabase } from '@/utils/db/data-export'
import { AUTO_UPLOAD_KEY, downloadFromCloud, uploadToCloud, validateToken } from '@/utils/sync/gistSync'
import * as Progress from '@radix-ui/react-progress'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { useCallback, useEffect, useState } from 'react'

const CLOUD_TOKEN_KEY = 'qwerty-learner-cloud-token'
const CLOUD_GIST_ID_KEY = 'qwerty-learner-cloud-gist-id'
const CLOUD_LAST_SYNC_KEY = 'qwerty-learner-cloud-last-sync'
const AUTO_SYNC_KEY = 'qwerty-learner-auto-sync'

export default function DataSetting() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  // 云端同步状态
  const [cloudToken, setCloudToken] = useState('')
  const [cloudGistId, setCloudGistId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncError, setSyncError] = useState('')
  const [lastSyncTime, setLastSyncTime] = useState('')
  const [autoSync, setAutoSync] = useState(false)
  const [autoUpload, setAutoUpload] = useState(false)

  // 从 localStorage 加载已保存的 Token 和 Gist ID
  useEffect(() => {
    const savedToken = localStorage.getItem(CLOUD_TOKEN_KEY)
    const savedGistId = localStorage.getItem(CLOUD_GIST_ID_KEY)
    const savedLastSync = localStorage.getItem(CLOUD_LAST_SYNC_KEY)
    const savedAutoSync = localStorage.getItem(AUTO_SYNC_KEY)
    const savedAutoUpload = localStorage.getItem(AUTO_UPLOAD_KEY)
    if (savedToken) setCloudToken(savedToken)
    if (savedGistId) setCloudGistId(savedGistId)
    if (savedLastSync) setLastSyncTime(savedLastSync)
    if (savedAutoSync === 'true') setAutoSync(true)
    if (savedAutoUpload === 'true') setAutoUpload(true)
  }, [])

  // 切换自动同步
  const handleAutoSyncToggle = (checked: boolean) => {
    setAutoSync(checked)
    localStorage.setItem(AUTO_SYNC_KEY, checked ? 'true' : 'false')
  }

  // 切换自动上传
  const handleAutoUploadToggle = (checked: boolean) => {
    setAutoUpload(checked)
    localStorage.setItem(AUTO_UPLOAD_KEY, checked ? 'true' : 'false')
  }

  const exportProgressCallback = useCallback(({ totalRows, completedRows, done }: ExportProgress) => {
    if (done) {
      setIsExporting(false)
      setExportProgress(100)
      return true
    }
    if (totalRows) {
      setExportProgress(Math.floor((completedRows / totalRows) * 100))
    }

    return true
  }, [])

  const onClickExport = useCallback(() => {
    setExportProgress(0)
    setIsExporting(true)
    exportDatabase(exportProgressCallback)
  }, [exportProgressCallback])

  const importProgressCallback = useCallback(({ totalRows, completedRows, done }: ImportProgress) => {
    if (done) {
      setIsImporting(false)
      setImportProgress(100)
      return true
    }
    if (totalRows) {
      setImportProgress(Math.floor((completedRows / totalRows) * 100))
    }

    return true
  }, [])

  const onStartImport = useCallback(() => {
    setImportProgress(0)
    setIsImporting(true)
  }, [])

  const onClickImport = useCallback(() => {
    importDatabase(onStartImport, importProgressCallback)
  }, [importProgressCallback, onStartImport])

  // 保存 Token 到 localStorage
  const handleTokenChange = (value: string) => {
    setCloudToken(value)
    localStorage.setItem(CLOUD_TOKEN_KEY, value)
  }

  // 保存 Gist ID 到 localStorage
  const handleGistIdChange = (value: string) => {
    setCloudGistId(value)
    localStorage.setItem(CLOUD_GIST_ID_KEY, value)
  }

  // 上传到云端
  const handleUpload = async () => {
    if (!cloudToken) {
      setSyncError('请先填写 GitHub Personal Access Token')
      return
    }

    setIsSyncing(true)
    setSyncError('')
    setSyncMessage('正在验证 Token...')

    // 验证 Token
    const isValid = await validateToken(cloudToken)
    if (!isValid) {
      setIsSyncing(false)
      setSyncError('Token 无效或没有权限，请检查后重试')
      return
    }

    setSyncMessage('正在上传数据到云端...')
    const result = await uploadToCloud(cloudToken, cloudGistId || undefined)

    setIsSyncing(false)
    if (result.success && result.gistId) {
      if (!cloudGistId) {
        handleGistIdChange(result.gistId)
      }
      const timeStr = new Date().toLocaleString('zh-CN')
      setLastSyncTime(timeStr)
      localStorage.setItem(CLOUD_LAST_SYNC_KEY, timeStr)
      setSyncMessage(`上传成功！Gist ID: ${result.gistId}`)
      setTimeout(() => setSyncMessage(''), 5000)
    } else {
      setSyncError(result.error || '上传失败，请重试')
    }
  }

  // 从云端下载
  const handleDownload = async () => {
    if (!cloudToken) {
      setSyncError('请先填写 GitHub Personal Access Token')
      return
    }
    if (!cloudGistId) {
      setSyncError('请先填写 Gist ID（首次上传后会自动填充）')
      return
    }

    if (!window.confirm('从云端下载数据将完全覆盖当前本地数据，确定继续吗？')) {
      return
    }

    setIsSyncing(true)
    setSyncError('')
    setSyncMessage('正在验证 Token...')

    const isValid = await validateToken(cloudToken)
    if (!isValid) {
      setIsSyncing(false)
      setSyncError('Token 无效或没有权限，请检查后重试')
      return
    }

    setSyncMessage('正在从云端下载数据...')
    const result = await downloadFromCloud(cloudToken, cloudGistId)

    setIsSyncing(false)
    if (result.success) {
      const timeStr = new Date().toLocaleString('zh-CN')
      setLastSyncTime(timeStr)
      localStorage.setItem(CLOUD_LAST_SYNC_KEY, timeStr)
      setSyncMessage('下载成功！页面将在 2 秒后刷新以加载新数据')
      setTimeout(() => window.location.reload(), 2000)
    } else {
      setSyncError(result.error || '下载失败，请重试')
    }
  }

  return (
    <ScrollArea.Root className="flex-1 select-none overflow-y-auto ">
      <ScrollArea.Viewport className="h-full w-full px-3">
        <div className={styles.tabContent}>
          {/* 本地数据导出 */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>数据导出</span>
            <span className={styles.sectionDescription}>
              目前，用户的练习数据<strong>仅保存在本地</strong>。如果您需要在不同的设备、浏览器或者其他非官方部署上使用 Qwerty Learner，
              您需要手动进行数据同步和保存。为了保留您的练习进度，以及使用近期即将上线的数据分析和智能训练功能，
              我们建议您及时备份您的数据。
            </span>
            <span className="pl-4 text-left text-sm font-bold leading-tight text-red-500">
              为了您的数据安全，请不要修改导出的数据文件。
            </span>
            <div className="flex h-3 w-full items-center justify-start px-5">
              <Progress.Root
                className="translate-z-0 relative h-2 w-11/12 transform  overflow-hidden rounded-full bg-gray-200"
                value={exportProgress}
              >
                <Progress.Indicator
                  className="cubic-bezier(0.65, 0, 0.35, 1) h-full w-full bg-indigo-400 transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${100 - exportProgress}%)` }}
                />
              </Progress.Root>
              <span className="ml-4 w-10 text-xs font-normal text-gray-600">{`${exportProgress}%`}</span>
            </div>

            <button
              className="my-btn-primary ml-4 disabled:bg-gray-300"
              type="button"
              onClick={onClickExport}
              disabled={isExporting}
              title="导出数据"
            >
              导出数据
            </button>
          </div>

          {/* 本地数据导入 */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>数据导入</span>
            <span className={styles.sectionDescription}>
              请注意，导入数据将<strong className="text-sm font-bold text-red-500"> 完全覆盖 </strong>当前数据。请谨慎操作。
            </span>

            <div className="flex h-3 w-full items-center justify-start px-5">
              <Progress.Root
                className="translate-z-0 relative h-2 w-11/12 transform  overflow-hidden rounded-full bg-gray-200"
                value={importProgress}
              >
                <Progress.Indicator
                  className="cubic-bezier(0.65, 0, 0.35, 1) h-full w-full bg-indigo-400 transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${100 - importProgress}%)` }}
                />
              </Progress.Root>
              <span className="ml-4 w-10 text-xs font-normal text-gray-600">{`${importProgress}%`}</span>
            </div>

            <button
              className="my-btn-primary ml-4 disabled:bg-gray-300"
              type="button"
              onClick={onClickImport}
              disabled={isImporting}
              title="导入数据"
            >
              导入数据
            </button>
          </div>

          {/* 云端同步 */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>云端同步（GitHub Gist）</span>
            <span className={styles.sectionDescription}>
              使用 GitHub Gist 免费存储练习数据，实现多端同步。需要创建一个 GitHub Personal Access Token（勾选 gist 权限）。 数据以私密 Gist
              形式存储，仅你自己可见。
            </span>

            {lastSyncTime && <span className="pl-4 text-xs text-gray-500">最后同步时间：{lastSyncTime}</span>}

            {/* 自动同步开关 */}
            <div className="flex w-full items-center justify-between pl-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">启动时自动同步</span>
                <span className="text-xs text-gray-400">每次打开页面自动从云端下载最新数据（云端比本地新时才下载）</span>
              </div>
              <button
                type="button"
                onClick={() => handleAutoSyncToggle(!autoSync)}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${autoSync ? 'bg-indigo-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    autoSync ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* 自动上传开关 */}
            <div className="flex w-full items-center justify-between pl-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">练习完成后自动上传</span>
                <span className="text-xs text-gray-400">每章练习结束后自动上传数据到云端（3 秒防抖，连续完成只上传最后一次）</span>
              </div>
              <button
                type="button"
                onClick={() => handleAutoUploadToggle(!autoUpload)}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${autoUpload ? 'bg-indigo-500' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    autoUpload ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Token 输入 */}
            <div className="flex w-full flex-col gap-2 pl-4">
              <label className="text-sm font-medium text-gray-600">GitHub Personal Access Token</label>
              <div className="flex w-full items-center gap-2">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={cloudToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {showToken ? '隐藏' : '显示'}
                </button>
              </div>
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=Qwerty+Learner+Sync"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline"
              >
                没有 Token？点击这里创建（只需勾选 gist 权限）
              </a>
            </div>

            {/* Gist ID 输入 */}
            <div className="flex w-full flex-col gap-2 pl-4">
              <label className="text-sm font-medium text-gray-600">Gist ID（首次上传后自动填充，换设备时填写）</label>
              <input
                type="text"
                value={cloudGistId}
                onChange={(e) => handleGistIdChange(e.target.value)}
                placeholder="留空则创建新 Gist"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autoComplete="off"
              />
            </div>

            {/* 同步状态 */}
            {syncMessage && (
              <div className="w-full rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
                {syncMessage}
              </div>
            )}
            {syncError && (
              <div className="w-full rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-300">
                {syncError}
              </div>
            )}

            {/* 同步按钮 */}
            <div className="flex gap-3 pl-4">
              <button
                className="my-btn-primary disabled:bg-gray-300"
                type="button"
                onClick={handleUpload}
                disabled={isSyncing}
                title="上传本地数据到云端"
              >
                {isSyncing ? '同步中...' : '上传到云端'}
              </button>
              <button
                className="my-btn-primary disabled:bg-gray-300"
                type="button"
                onClick={handleDownload}
                disabled={isSyncing}
                title="从云端下载数据到本地"
              >
                {isSyncing ? '同步中...' : '从云端下载'}
              </button>
            </div>

            <span className="pl-4 text-xs text-gray-400">
              提示：Token 和 Gist ID 仅保存在本地浏览器中，不会上传到任何服务器。换设备时需重新填写 Token 和 Gist ID。
            </span>
          </div>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent " orientation="vertical"></ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
