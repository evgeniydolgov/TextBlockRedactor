import type { PutQueueStatus } from '../../blocks/sync/putQueue'

type StatusOptions = {
  initialized: boolean
  demo: boolean
  storageError?: string | null
  localError?: string | null
}

export function getPutSyncStatusText(status: PutQueueStatus | null, options: StatusOptions): string {
  if (options.storageError) return options.storageError
  if (options.localError) return 'Синхронизация не подтверждена: локальный черновик не сохранён'
  if (!options.initialized) return 'Синхронизация не инициализирована'
  if (!status) return 'Синхронизация ожидает запуска'
  if (status.errorIds.length) return `Ошибка синхронизации блоков: ${status.errorIds.join(', ')}`
  if (status.active || status.pending) return 'Синхронизируется'
  if (status.structural) return 'Создание и удаление блоков пока сохранены только локально'
  return options.demo ? 'Демо: изменения блоков подтверждены' : 'Синхронизировано с сервером'
}
