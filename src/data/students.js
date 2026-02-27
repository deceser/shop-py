const FEMALE = new Set(['Поліна', 'Олександра', 'Віра', 'Аріна']);

export const STUDENTS = [
  { firstName: 'Дмитро', lastName: 'Брусінський' },
  { firstName: 'Поліна', lastName: 'Гайдай' },
  { firstName: 'Богдан', lastName: 'Дубановський' },
  { firstName: 'Сергій', lastName: 'Жидков' },
  { firstName: 'Олександр', lastName: 'Зелінський' },
  { firstName: 'Тимур', lastName: 'Капустін' },
  { firstName: 'Арсеній', lastName: 'Неділько' },
  { firstName: 'Роман', lastName: 'Пантелєєв' },
  { firstName: 'Філіпп', lastName: 'Поварнін' },
  { firstName: 'Олександра', lastName: 'Поліщук' },
  { firstName: 'Микита', lastName: 'Рябуха' },
  { firstName: 'Данило', lastName: 'Рязанцев' },
  { firstName: 'Віра', lastName: 'Сахно' },
  { firstName: 'Олег', lastName: 'Сорока' },
  { firstName: 'Аріна', lastName: 'Хабазня' },
  { firstName: 'Данило', lastName: 'Цурпаль' },
  { firstName: 'Микита', lastName: 'Чувал' },
].map((s) => ({ ...s, gender: FEMALE.has(s.firstName) ? 'female' : 'male' }));
