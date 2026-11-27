import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import WheelPicker from './kokonutui/wheel-picker.jsx'
import { getLocalDateInputValue } from '../utils/date.js'
import { formatBirthDate } from '../utils/userAge.js'
import './BirthDateWheelPicker.css'

const FIRST_YEAR = 1900
const pad = (value) => String(value).padStart(2, '0')
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const months = Array.from({ length: 12 }, (_, index) => ({
  value: pad(index + 1),
  label: monthFormatter.format(new Date(2000, index, 1)),
}))

function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate()
}

function toSelection(dateValue, today) {
  const parts = /^\d{4}-\d{2}-\d{2}$/.test(dateValue || '') ? dateValue.split('-') : today.split('-')
  const todayParts = today.split('-')
  let year = Math.min(Math.max(Number(parts[0]), FIRST_YEAR), Number(todayParts[0]))
  let month = Math.min(Math.max(Number(parts[1]), 1), year === Number(todayParts[0]) ? Number(todayParts[1]) : 12)
  let day = Math.min(Math.max(Number(parts[2]), 1), daysInMonth(year, month))
  if (year === Number(todayParts[0]) && month === Number(todayParts[1])) {
    day = Math.min(day, Number(todayParts[2]))
  }
  return { year: String(year), month: pad(month), day: pad(day) }
}

function toDate(selection) {
  return `${selection.year}-${selection.month}-${selection.day}`
}

function BirthDateWheelPicker({ value, onChange, label = 'Data de nascimento', ref }) {
  const wheelRef = useRef(null)
  const latestSelection = useRef(null)
  const today = getLocalDateInputValue()
  const selection = toSelection(value || today, today)
  latestSelection.current = selection

  const maximumMonth = Number(selection.year) === Number(today.slice(0, 4))
    ? Number(today.slice(5, 7))
    : 12
  const maximumDay = Number(selection.year) === Number(today.slice(0, 4)) && selection.month === today.slice(5, 7)
    ? Number(today.slice(8, 10))
    : daysInMonth(selection.year, selection.month)
  const columns = [
    {
      id: 'day',
      label: 'Dia',
      className: 'birth-date-wheel__day',
      options: Array.from({ length: maximumDay }, (_, index) => {
        const day = pad(index + 1)
        return { value: day, label: day }
      }),
    },
    {
      id: 'month',
      label: 'Mês',
      className: 'birth-date-wheel__month',
      options: months.slice(0, maximumMonth),
    },
    {
      id: 'year',
      label: 'Ano',
      className: 'birth-date-wheel__year',
      options: Array.from({ length: Number(today.slice(0, 4)) - FIRST_YEAR + 1 }, (_, index) => {
        const year = String(FIRST_YEAR + index)
        return { value: year, label: year }
      }),
    },
  ]

  function handleValueChange(next) {
    const normalized = toSelection(toDate(next), today)
    latestSelection.current = normalized
    onChange?.(toDate(normalized))
  }

  useImperativeHandle(ref, () => ({
    getDate() {
      const current = wheelRef.current?.getSelection() ?? latestSelection.current
      return toDate(toSelection(toDate(current), getLocalDateInputValue()))
    },
  }), [])

  useLayoutEffect(() => {
    latestSelection.current = selection
  }, [value])

  return (
    <div className="birth-date-wheel-picker">
      <div className="birth-date-wheel-picker__labels" aria-hidden="true">
        <span>Dia</span><span>Mês</span><span>Ano</span>
      </div>
      <WheelPicker
        ref={wheelRef}
        className="birth-date-wheel"
        columns={columns}
        value={selection}
        onValueChange={handleValueChange}
        label={label}
      />
      <output className="birth-date-wheel-picker__value" aria-label="Data selecionada">
        {formatBirthDate(toDate(selection))}
      </output>
    </div>
  )
}

export default BirthDateWheelPicker
