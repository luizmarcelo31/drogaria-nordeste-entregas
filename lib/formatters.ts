export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function isValidCpf(value: string) {
  const digits = onlyDigits(value)
  if (digits.length !== 11 || /^([0-9])\1+$/.test(digits)) return false
  let sum = 0
  for (let index = 0; index < 9; index += 1) sum += Number(digits[index]) * (10 - index)
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== Number(digits[9])) return false
  sum = 0
  for (let index = 0; index < 10; index += 1) sum += Number(digits[index]) * (11 - index)
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  return digit === Number(digits[10])
}

export function isValidPlate(value: string) { return /^[A-Z0-9]{7}$/.test(value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()) }

export const UNIT_TIME_ZONE = 'America/Recife'

export function unitDateKey(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: UNIT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}

export function unitDateKeyOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return unitDateKey(date)
}

export function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatPlate(value: string) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
  if (clean.length <= 3) return clean
  return `${clean.slice(0, 3)}-${clean.slice(3)}`
}

export function formatDate(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  return digits.replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2')
}

export function formatTime(value: string) {
  const digits = onlyDigits(value).slice(0, 4)
  return digits.replace(/(\d{2})(\d)/, '$1:$2')
}

export function formatDocumentOrPlate(value: string) {
  return /[A-Za-z]/.test(value) ? formatPlate(value) : formatCpf(value)
}
