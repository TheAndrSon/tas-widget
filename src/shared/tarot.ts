export interface TarotCard {
  id: string
  numeral: string
  name: string
  nameEn: string
  upright: string
  reversed: string
}

export interface DrawnCard {
  card: TarotCard
  reversed: boolean
  position: string
}

export const MAJOR_ARCANA: TarotCard[] = [
  { id: 'fool', numeral: '0', name: 'Шут', nameEn: 'The Fool', upright: 'Новое начало, спонтанность, вера в путь', reversed: 'Безрассудство, страх сделать шаг' },
  { id: 'magician', numeral: 'I', name: 'Маг', nameEn: 'The Magician', upright: 'Воля, ресурс, умение действовать', reversed: 'Манипуляция, распыление сил' },
  { id: 'priestess', numeral: 'II', name: 'Верховная Жрица', nameEn: 'The High Priestess', upright: 'Интуиция, тишина, скрытое знание', reversed: 'Игнорирование внутреннего голоса' },
  { id: 'empress', numeral: 'III', name: 'Императрица', nameEn: 'The Empress', upright: 'Забота, изобилие, творческая сила', reversed: 'Истощение, зависимость, застой' },
  { id: 'emperor', numeral: 'IV', name: 'Император', nameEn: 'The Emperor', upright: 'Структура, границы, ответственность', reversed: 'Жёсткость, потеря контроля' },
  { id: 'hierophant', numeral: 'V', name: 'Иерофант', nameEn: 'The Hierophant', upright: 'Традиция, наставник, правило', reversed: 'Догма, желание выйти из рамок' },
  { id: 'lovers', numeral: 'VI', name: 'Влюблённые', nameEn: 'The Lovers', upright: 'Выбор, близость, согласие', reversed: 'Разлад, сомнение в выборе' },
  { id: 'chariot', numeral: 'VII', name: 'Колесница', nameEn: 'The Chariot', upright: 'Движение, воля, победа', reversed: 'Пробуксовка, борьба за контроль' },
  { id: 'strength', numeral: 'VIII', name: 'Сила', nameEn: 'Strength', upright: 'Мягкая сила, терпение, смелость', reversed: 'Страх, неуверенность, срывы' },
  { id: 'hermit', numeral: 'IX', name: 'Отшельник', nameEn: 'The Hermit', upright: 'Пауза, поиск смысла, одиночество', reversed: 'Изоляция, избегание людей' },
  { id: 'wheel', numeral: 'X', name: 'Колесо Фортуны', nameEn: 'Wheel of Fortune', upright: 'Перемены, цикл, шанс', reversed: 'Сопротивление переменам' },
  { id: 'justice', numeral: 'XI', name: 'Справедливость', nameEn: 'Justice', upright: 'Честность, баланс, последствия', reversed: 'Предвзятость, уход от ответственности' },
  { id: 'hanged', numeral: 'XII', name: 'Повешенный', nameEn: 'The Hanged Man', upright: 'Смена угла, пауза, отпускание', reversed: 'Затянувшееся ожидание, жертва без смысла' },
  { id: 'death', numeral: 'XIII', name: 'Смерть', nameEn: 'Death', upright: 'Завершение, трансформация, точка', reversed: 'Страх перемен, цепляние за прошлое' },
  { id: 'temperance', numeral: 'XIV', name: 'Умеренность', nameEn: 'Temperance', upright: 'Мера, баланс, исцеление', reversed: 'Крайности, перегруз' },
  { id: 'devil', numeral: 'XV', name: 'Дьявол', nameEn: 'The Devil', upright: 'Зависимость, соблазн, тень', reversed: 'Освобождение от зависимости' },
  { id: 'tower', numeral: 'XVI', name: 'Башня', nameEn: 'The Tower', upright: 'Резкая перемена, обрушение старого', reversed: 'Отложенный кризис, страх разрушения' },
  { id: 'star', numeral: 'XVII', name: 'Звезда', nameEn: 'The Star', upright: 'Надежда, вдохновение, восстановление', reversed: 'Разочарование, потеря веры' },
  { id: 'moon', numeral: 'XVIII', name: 'Луна', nameEn: 'The Moon', upright: 'Неясность, сны, воображение', reversed: 'Туман рассеивается, страхи теряют силу' },
  { id: 'sun', numeral: 'XIX', name: 'Солнце', nameEn: 'The Sun', upright: 'Радость, ясность, успех', reversed: 'Тусклый день, усталость, сомнение' },
  { id: 'judgement', numeral: 'XX', name: 'Суд', nameEn: 'Judgement', upright: 'Пробуждение, честный итог, зов', reversed: 'Самокритика, отказ слышать зов' },
  { id: 'world', numeral: 'XXI', name: 'Мир', nameEn: 'The World', upright: 'Завершение цикла, целостность', reversed: 'Незакрытый гештальт, финал откладывается' }
]

const SUITS: Array<{
  id: string
  name: string
  nameEn: string
  theme: string
  element: string
  upright: string[]
  reversed: string[]
}> = [
  {
    id: 'wands',
    name: 'Жезлов',
    nameEn: 'Wands',
    theme: 'воля и действие',
    element: 'огонь',
    upright: ['импульс', 'рост', 'решимость', 'уверенность', 'борьба', 'победа', 'защита', 'скорость', 'стойкость', 'груз', 'весть', 'порыв', 'харизма', 'лидерство'],
    reversed: ['спешка', 'выгорание', 'сомнение', 'сопротивление', 'усталость', 'поражение', 'оборона', 'задержка', 'перегруз', 'потеря направления', 'незрелость', 'безрассудство', 'ревность', 'самодурство']
  },
  {
    id: 'cups',
    name: 'Кубков',
    nameEn: 'Cups',
    theme: 'чувства и отношения',
    element: 'вода',
    upright: ['нежность', 'союз', 'радость', 'уют', 'печаль', 'тепло', 'выбор', 'мечта', 'удовлетворение', 'гармония', 'чуткость', 'романтика', 'забота', 'зрелость чувств'],
    reversed: ['закрытость', 'разлад', 'уныние', 'одиночество', 'обида', 'холод', 'сомнение', 'иллюзия', 'пресыщение', 'разочарование', 'капризы', 'иллюзии', 'обиды', 'холодность']
  },
  {
    id: 'swords',
    name: 'Мечей',
    nameEn: 'Swords',
    theme: 'мысли и правда',
    element: 'воздух',
    upright: ['ясность', 'решение', 'разрыв', 'отдых', 'конфликт', 'переход', 'хитрость', 'правда', 'тревога', 'точка', 'любопытство', 'стремительность', 'проницательность', 'авторитет'],
    reversed: ['туман', 'сомнение', 'затянувшийся конфликт', 'истощение', 'стыд', 'буря', 'скрытность', 'иллюзия', 'паника', 'поражение', 'сплетни', 'агрессия', 'жёсткость', 'тирания']
  },
  {
    id: 'pentacles',
    name: 'Пентаклей',
    nameEn: 'Pentacles',
    theme: 'ресурсы и быт',
    element: 'земля',
    upright: ['шанс', 'баланс', 'рост', 'стабильность', 'нужда', 'щедрость', 'терпение', 'мастерство', 'достаток', 'наследие', 'учёба', 'методичность', 'практичность', 'богатство'],
    reversed: ['упущенный шанс', 'перекос', 'застой', 'жадность', 'долг', 'зависимость', 'нетерпение', 'дилетантство', 'потеря', 'раздел', 'лень', 'застой', 'мелочность', 'скупость']
  }
]

const RANKS = [
  { id: 'ace', name: 'Туз', numeral: 'A' },
  { id: 'two', name: 'Двойка', numeral: '2' },
  { id: 'three', name: 'Тройка', numeral: '3' },
  { id: 'four', name: 'Четвёрка', numeral: '4' },
  { id: 'five', name: 'Пятёрка', numeral: '5' },
  { id: 'six', name: 'Шестёрка', numeral: '6' },
  { id: 'seven', name: 'Семёрка', numeral: '7' },
  { id: 'eight', name: 'Восьмёрка', numeral: '8' },
  { id: 'nine', name: 'Девятка', numeral: '9' },
  { id: 'ten', name: 'Десятка', numeral: '10' },
  { id: 'page', name: 'Паж', numeral: 'P' },
  { id: 'knight', name: 'Рыцарь', numeral: 'N' },
  { id: 'queen', name: 'Королева', numeral: 'Q' },
  { id: 'king', name: 'Король', numeral: 'K' }
]

export const MINOR_ARCANA: TarotCard[] = SUITS.flatMap((suit) =>
  RANKS.map((rank, index) => ({
    id: `${suit.id}-${rank.id}`,
    numeral: rank.numeral,
    name: `${rank.name} ${suit.name}`,
    nameEn: `${rank.name} of ${suit.nameEn}`,
    upright: `${suit.upright[index] ?? suit.theme} · ${suit.theme}`,
    reversed: `${suit.reversed[index] ?? suit.theme} · ${suit.theme}`
  }))
)

export const TAROT_CARDS: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA]

export const SPREAD_POSITIONS: Record<number, string[]> = {
  1: ['Послание дня'],
  3: ['Ситуация', 'Совет', 'Итог'],
  5: ['Прошлое', 'Настоящее', 'Скрытое', 'Совет', 'Итог']
}

export function drawSpread(count: 1 | 3 | 5, allowReversed: boolean): DrawnCard[] {
  const pool = [...TAROT_CARDS]
  const result: DrawnCard[] = []
  const positions = SPREAD_POSITIONS[count] ?? ['Карта']
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length)
    const card = pool.splice(index, 1)[0]
    result.push({
      card,
      reversed: allowReversed && Math.random() < 0.32,
      position: positions[i] ?? `Карта ${i + 1}`
    })
  }
  return result
}

export function cardMeaning(drawn: DrawnCard): string {
  return drawn.reversed ? drawn.card.reversed : drawn.card.upright
}
