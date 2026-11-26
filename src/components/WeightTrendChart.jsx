import { useState } from 'react'
import { getAgeInfo } from '../utils/userAge.js'
import './WeightTrendChart.css'

const PERIODS = [
  { id: 'week', label: 'Semana', days: 7 },
  { id: 'month', label: 'Mês', days: 30 },
  { id: 'year', label: 'Ano', days: 365 },
]
const REFERENCE_BMI = 21.7
// WHO 2007 BMI-for-age median values at completed ages 5–19.
// Age 5 uses the first published month (5 years, 1 month).
const PEDIATRIC_MEDIAN_BMI = {
  MALE: [15.3, 15.3, 15.5, 15.7, 16.0, 16.4, 16.9, 17.5, 18.2, 19.0, 19.8, 20.5, 21.1, 21.7, 22.2],
  FEMALE: [15.2, 15.3, 15.4, 15.7, 16.1, 16.6, 17.2, 18.0, 18.8, 19.6, 20.2, 20.7, 21.0, 21.3, 21.4],
}

export default function WeightTrendChart({ records = [], heightCm, birthDate, gender }) {
  const [periodId, setPeriodId] = useState('month')
  const period = PERIODS.find((item) => item.id === periodId) ?? PERIODS[1]
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - period.days)
  const points = records
    .map((record) => ({ ...record, date: new Date(record.recordedAt) }))
    .filter((record) => !Number.isNaN(record.date.getTime()) && record.date >= start && record.date <= end)
  const chart = { width: 360, height: 210, left: 22, right: 326, top: 19, bottom: 150 }
  const ageInfo = getAgeInfo(birthDate)
  const pediatricReferenceBmi = ageInfo && ageInfo.age >= 5 && ageInfo.age < 20 && gender
    ? PEDIATRIC_MEDIAN_BMI[gender]?.[ageInfo.age - 5] ?? null
    : null
  const referenceBmi = ageInfo?.age >= 20 ? REFERENCE_BMI : pediatricReferenceBmi
  const referenceWeightKg = referenceBmi !== null && Number.isFinite(heightCm) && heightCm > 0
    ? referenceBmi * (heightCm / 100) ** 2
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
  const isPediatricReference = pediatricReferenceBmi !== null
  const referenceBmiLabel = referenceBmi === null ? '' : referenceBmiFormatter.format(referenceBmi)

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
              <title>{isPediatricReference ? 'Referência mediana de IMC para ' + ageInfo.age + ' anos e gênero ' + (gender === 'MALE' ? 'masculino' : 'feminino') : 'Referência estimada pelo IMC adulto'}: {weightFormatter.format(referenceWeightKg)} kg</title>
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
            <span>{isPediatricReference
              ? `Referência OMS (${ageInfo.age} anos · IMC mediano ${referenceBmiLabel}): ${weightFormatter.format(referenceWeightKg)} kg`
              : `Referência pelo IMC adulto (${referenceBmiLabel}): ${weightFormatter.format(referenceWeightKg)} kg`}</span>
          </div>
          <p className="profile-weight-chart-note">{isPediatricReference
            ? 'Referência populacional de IMC mediano por idade e gênero (OMS 2007); não é peso ideal nem meta individual.'
            : 'Estimativa baseada na faixa de IMC adulto; não é uma meta clínica individual.'}</p>
        </>
      )}
      {referenceWeightKg === null && ageInfo && ageInfo.age < 5 && <p className="profile-weight-chart-note">Para menores de 5 anos, a avaliação usa curvas específicas de crescimento infantil; por isso, a referência adulta não é exibida.</p>}
      {referenceWeightKg === null && (!ageInfo || (ageInfo.age >= 5 && ageInfo.age < 20 && !gender)) && <p className="profile-weight-chart-note">Para exibir uma referência por idade, informe a data de nascimento e o gênero no perfil.</p>}
    </div>
  )
}
