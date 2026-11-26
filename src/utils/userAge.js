export function getAgeInfo(birthDate, today = new Date()) {
  if (!birthDate) return null

  const [year, month, day] = birthDate.split('-').map(Number)
  if (!year || !month || !day) return null

  let age = today.getFullYear() - year
  const birthdayHasPassed = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  if (!birthdayHasPassed) age -= 1
  if (age < 0) return null

  return {
    age,
    category: age < 10 ? 'Criança' : age < 20 ? 'Adolescente' : 'Adulto',
  }
}

export function formatBirthDate(birthDate) {
  if (!birthDate) return ''
  const [year, month, day] = birthDate.split('-')
  return `${day}/${month}/${year}`
}
