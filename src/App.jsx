import { useMemo, useState } from 'react'
import { MEMBERS, QUESTIONS } from './data'
import './App.css'

const LETTERS = ['А', 'Б', 'В', 'Г']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function Marquee({ text, variant = '' }) {
  const items = Array.from({ length: 8 }, () => text)
  return (
    <div className={`marquee ${variant}`} aria-hidden="true">
      <div className="marquee__track">
        {items.concat(items).map((t, i) => (
          <span key={i}>{t} ✶ </span>
        ))}
      </div>
    </div>
  )
}

function Intro({ onStart }) {
  return (
    <section className="intro screen">
      <div className="intro__logo-wrap">
        <img className="intro__logo" src="/img/logo.png" alt="ХОХМА" />
        <span className="sticker sticker--blue">абсурдкор</span>
        <span className="sticker sticker--lime">тест</span>
      </div>

      <h1 className="chrome">КТО ТЫ<br />ИЗ ХОХМЫ?</h1>

      <p className="intro__lead">
        8 вопросов, 4 бойца, 1 правда о тебе.<br />
        Узнай, кто ты из группы.
      </p>

      <div className="intro__poster">
        <img src="/img/koronka.jpg" alt="Обложка EP «Коронка»" />
        <span className="sticker sticker--red">ярославль</span>
      </div>

      <button className="btn btn--big" onClick={onStart}>
        ПОГНАЛИ →
      </button>
    </section>
  )
}

function Quiz({ index, question, onAnswer }) {
  const answers = useMemo(() => shuffle(question.a), [question])
  const progress = (index / QUESTIONS.length) * 100

  return (
    <section className="quiz screen" key={index}>
      <div className="progress">
        <div className="progress__bar" style={{ width: `${progress}%` }} />
        <span className="progress__label">
          {index + 1} / {QUESTIONS.length}
        </span>
      </div>

      <div className="quiz__num">#{String(index + 1).padStart(2, '0')}</div>
      <h2 className="quiz__q">{question.q}</h2>

      <div className="answers">
        {answers.map(([label, who], i) => (
          <button
            key={label}
            className="answer"
            style={{ '--d': `${i * 70}ms`, '--tilt': `${(i % 2 ? 1 : -1) * 0.8}deg` }}
            onClick={() => onAnswer(who)}
          >
            <span className="answer__letter">{LETTERS[i]}</span>
            <span className="answer__text">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Avatar({ member }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="avatar" style={{ '--c': member.color, '--ink': member.ink }}>
      <div className="avatar__burst" />
      {failed ? (
        <span className="avatar__initial">{member.name[0]}</span>
      ) : (
        <img src={member.photo} alt={member.name} onError={() => setFailed(true)} />
      )}
    </div>
  )
}

function Result({ scores, winner, onRestart }) {
  const m = MEMBERS[winner]
  const total = QUESTIONS.length
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = `Я — ${m.name} из группы ХОХМА! ${m.tagline}. А ты кто?`
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Кто ты из ХОХМЫ?', text, url })
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* пользователь закрыл окно «Поделиться» */
    }
  }

  return (
    <section className="result screen" style={{ '--c': m.color, '--ink': m.ink }}>
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} style={{ '--i': i }} />
        ))}
      </div>

      <p className="result__pre">ТЫ ИЗ ХОХМЫ —</p>
      <Avatar member={m} />
      <h2 className="result__name chrome">{m.name}</h2>
      <span className="result__role">{m.role}</span>

      <div className="card">
        <h3 className="card__tagline">{m.tagline}</h3>
        <p>{m.text}</p>
        <ul className="traits">
          {m.traits.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="card card--stats">
        <h3>Твой состав</h3>
        {Object.entries(MEMBERS)
          .sort(([a], [b]) => scores[b] - scores[a])
          .map(([key, mem]) => {
            const pct = Math.round((scores[key] / total) * 100)
            return (
              <div className="stat" key={key}>
                <span className="stat__name">{mem.name}</span>
                <div className="stat__track">
                  <div
                    className="stat__fill"
                    style={{ width: `${pct}%`, background: mem.color }}
                  />
                </div>
                <span className="stat__pct">{pct}%</span>
              </div>
            )
          })}
      </div>

      <div className="result__actions">
        <button className="btn" onClick={share}>
          {copied ? 'СКОПИРОВАНО ✓' : 'ПОДЕЛИТЬСЯ'}
        </button>
        <button className="btn btn--ghost" onClick={onRestart}>
          ЕЩЁ РАЗ ↻
        </button>
      </div>

      <a className="listen" href="http://band.link/koronka" target="_blank" rel="noreferrer">
        <img src="/img/band.jpg" alt="Группа ХОХМА" />
        <span>СЛУШАТЬ «КОРОНКУ» →</span>
      </a>
    </section>
  )
}

const emptyScores = () => Object.fromEntries(Object.keys(MEMBERS).map((k) => [k, 0]))

export default function App() {
  const [step, setStep] = useState(-1) // -1 интро, 0..n-1 вопросы, n результат
  const [scores, setScores] = useState(emptyScores)
  const [last, setLast] = useState(null)

  const answer = (who) => {
    setScores((s) => ({ ...s, [who]: s[who] + 1 }))
    setLast(who)
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const restart = () => {
    setScores(emptyScores())
    setLast(null)
    setStep(-1)
  }

  const winner = useMemo(() => {
    const max = Math.max(...Object.values(scores))
    const leaders = Object.keys(scores).filter((k) => scores[k] === max)
    // при ничьей побеждает тот, за кого был последний ответ, иначе — случайный из лидеров
    return leaders.includes(last) ? last : leaders[Math.floor(Math.random() * leaders.length)]
  }, [scores, last])

  return (
    <div className="app">
      <div className="halftone" aria-hidden="true" />
      <Marquee text="ХОХМА · КТО ТЫ ИЗ ХОХМЫ · АБСУРДКОР · ЯРОСЛАВЛЬ" />

      <main className="stage">
        {step === -1 && <Intro onStart={() => setStep(0)} />}
        {step >= 0 && step < QUESTIONS.length && (
          <Quiz index={step} question={QUESTIONS[step]} onAnswer={answer} />
        )}
        {step === QUESTIONS.length && (
          <Result scores={scores} winner={winner} onRestart={restart} />
        )}
      </main>

      <Marquee text="И НАШИМ И ВАШИМ РАЗДАСТ ГРУППА ХОХМА" variant="marquee--rev" />
      <footer className="footer">
        фан-тест · <a href="https://xxxoxxxma.ru" target="_blank" rel="noreferrer">xxxoxxxma.ru</a> ·{' '}
        <a href="https://t.me/xxxoxxxma" target="_blank" rel="noreferrer">telegram</a> ·{' '}
        <a href="https://vk.com/xxxoxxxma" target="_blank" rel="noreferrer">vk</a>
      </footer>
    </div>
  )
}
