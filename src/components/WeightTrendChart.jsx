import { useState } from 'react'
import './WeightTrendChart.css'

const PERIODS = [
  { id: 'week', label: 'Semana', days: 7 },
  { id: 'month', label: 'Mês', days: 30 },
  { id: 'year', label: 'Ano', days: 365 },
]
const REFERENCE_BMI = 21.7

export default function WeightTrendChart({ records = [], heightCm }) {
  const [periodId, setPeriodId] = useState('month')
  const period = PERIODS.find((item) => item.id === periodId) ?? PERIODS[1]
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - period.days)
  const points = records
    .map((record) => ({ ...record, date: new Date(record.recordedAt) }))
    .filter((record) => !Number.isNaN(record.date.getTime()) && record.date >= start && record.date <= end)
  const chart = { width: 360, height: 210, left: 22, right: 326, top: 19, bottom: 150 }
  const referenceWeightKg = Number.isFinite(heightCm) && heightCm > 0
    ? REFERENCE_BMI * (heightCm / 100) ** 2
    : null
  const weights = [...points.map((point) => point.weightKg), ...(referenceWeightKg === null ? [] : [referenceWeightKg])]
  const minimum = weights.length ? Math.min(...weights) : 0
  const maximum = weights.length ? Math.max(...weights) : 1
  const padding = Math.max((maximum - minimum) * 0.2, maximum * 0.025, 0.5)
  const minScale = Math.max(0, minimum - padding)
  const maxScale = maximum + padding
  const x = (index) => points.length < 2
    ? chart.left + (chart.right - chart.left) / 2
    : chart.left + (index / (points.length - 1)) * (chart.right - chart.left)
  const y = (weight) => chart.bottom - ((weight - minScale) / (maxScale - minScale || 1)) * (chart.bottom - chart.top)
  const line = points.map((point, index) => (index ? 'L ' : 'M ') + x(index) + ' ' + y(point.weightKg)).join(' ')
  const ticks = Array.from({ length: 4 }, (_, index) => maxScale - ((maxScale - minScale) / 3) * index)
  const dateLabelIndices = points.length <= 5
    ? points.map((_, index) => index)
    : [...new Set([0, Math.round((points.length - 1) / 3), Math.round((points.length - 1) * 2 / 3), points.length - 1])]
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
  const weightFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
  const referenceBmiFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const referenceY = referenceWeightKg === null ? null : y(referenceWeightKg)

  return (
    <div className="profile-weight-chart">
      <div className="profile-weight-chart-heading">
        <h3>Peso</h3>
        <span>{points.length ? weightFormatter.format(points.at(-1).weightKg) + ' kg' : 'Histórico'}</span>
      </div>
      <div className="profile-weight-periods" role="tablist" aria-label="Período do gráfico de peso">
        {PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={periodId === item.id}
            className={periodId === item.id ? 'is-active' : ''}
            onClick={() => setPeriodId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {points.length ? (
        <svg
          className="profile-weight-chart-svg"
          viewBox={'0 0 ' + chart.width + ' ' + chart.height}
          role="img"
          aria-label={'Histórico de peso nas últimas ' + period.days + ' dias'}
        >
          {ticks.map((tick, index) => {
            const tickY = chart.top + ((chart.bottom - chart.top) / 3) * index
            return (
              <g key={index}>
                <line x1={chart.left} x2={chart.right} y1={tickY} y2={tickY} />
                <text x="354" y={tickY + 3} textAnchor="end">{weightFormatter.format(tick)}</text>
              </g>
            )
          })}
          {referenceY !== null && (
            <line x1={chart.left} x2={chart.right} y1={referenceY} y2={referenceY} className="profile-weight-chart-reference">
              <title>{'Referência estimada pelo IMC adulto de ' + referenceBmiFormatter.format(REFERENCE_BMI) + ': ' + weightFormatter.format(referenceWeightKg) + ' kg'}</title>
            </line>
          )}
          {dateLabelIndices.map((index) => (
            <g key={(points[index].id ?? points[index].date.toISOString()) + '-' + index}>
              <line x1={x(index)} x2={x(index)} y1={chart.top} y2={chart.bottom} className="profile-weight-chart-guide" />
              <text x={x(index)} y="174" textAnchor="middle">{dateFormatter.format(points[index].date)}</text>
            </g>
          ))}
          <path d={line} className="profile-weight-chart-line" />
          {points.map((point, index) => (
            <circle
              key={(point.id ?? point.date.toISOString()) + '-' + index}
              cx={x(index)}
              cy={y(point.weightKg)}
              r="3.4"
              className="profile-weight-chart-point"
            >
              <title>{dateFormatter.format(point.date) + ': ' + weightFormatter.format(point.weightKg) + ' kg'}</title>
            </circle>
          ))}
        </svg>
      ) : (
        <p className="profile-weight-chart-empty">Não há pesagens neste período.</p>
      )}
      {referenceWeightKg !== null && (
        <>
          <div className="profile-weight-chart-legend">
            <span aria-hidden="true" />
            <span>Referência pelo IMC ({referenceBmiFormatter.format(REFERENCE_BMI)}): {weightFormatter.format(referenceWeightKg)} kg</span>
          </div>
          <p className="profile-weight-chart-note">Estimativa baseada na faixa de IMC adulto; não é uma meta clínica individual.</p>
        </>
      )}
    </div>
  )
}
