export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
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
