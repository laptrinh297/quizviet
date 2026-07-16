type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({
    t: new Date().toISOString(),
    level,
    message,
    ...data,
  }))
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
}
