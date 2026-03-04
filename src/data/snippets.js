export const SNIPPETS = [
  {
    id: 1,
    title: 'Завдання 1 — Змінна',
    code: `x = 10`,
  },
  {
    id: 2,
    title: 'Завдання 2 — Виведення',
    code: `print("Hello, World!")`,
  },
  {
    id: 3,
    title: 'Завдання 3 — Дві змінні',
    code: `a = 3
b = 7
print(a + b)`,
  },
  {
    id: 4,
    title: 'Завдання 4 — Рядок',
    code: `name = "Python"
print("I love " + name)`,
  },
  {
    id: 5,
    title: 'Завдання 5 — Арифметика',
    code: `x = 15
y = 4
result = x // y
print(result)`,
  },
  {
    id: 6,
    title: 'Завдання 6 — Умова if/else',
    code: `x = 10
if x > 5:
    print("big")
else:
    print("small")`,
  },
  {
    id: 7,
    title: 'Завдання 7 — if/elif/else',
    code: `score = 85
if score >= 90:
    print("A")
elif score >= 70:
    print("B")
else:
    print("C")`,
  },
  {
    id: 8,
    title: 'Завдання 8 — Проста функція',
    code: `def add(a, b):
    return a + b`,
  },
  {
    id: 9,
    title: 'Завдання 9 — Функція з умовою',
    code: `def is_even(n):
    return n % 2 == 0`,
  },
  {
    id: 10,
    title: 'Завдання 10 — Цикл for',
    code: `for i in range(1, 6):
    print(i)`,
  },
  {
    id: 11,
    title: 'Завдання 11 — Цикл while',
    code: `n = 1
while n <= 5:
    print(n)
    n += 1`,
  },
  {
    id: 12,
    title: 'Завдання 12 — Функція з циклом',
    code: `def sum_range(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total`,
  },
  {
    id: 13,
    title: 'Завдання 13 — Максимум у списку',
    code: `def find_max(nums):
    max_val = nums[0]
    for n in nums:
        if n > max_val:
            max_val = n
    return max_val`,
  },
  {
    id: 14,
    title: 'Завдання 14 — Обернути рядок',
    code: `def reverse_string(s):
    return s[::-1]`,
  },
  {
    id: 15,
    title: 'Завдання 15 — Підрахунок голосних',
    code: `def count_vowels(s):
    count = 0
    for c in s.lower():
        if c in "aeiou":
            count += 1
    return count`,
  },
  {
    id: 16,
    title: 'Завдання 16 — List comprehension',
    code: `squares = [x * x for x in range(1, 11)]`,
  },
  {
    id: 17,
    title: 'Завдання 17 — Фільтрація списку',
    code: `evens = [x for x in range(20) if x % 2 == 0]`,
  },
  {
    id: 18,
    title: 'Завдання 18 — Рекурсія',
    code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)`,
  },
  {
    id: 19,
    title: 'Завдання 19 — Просте число',
    code: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, n):
        if n % i == 0:
            return False
    return True`,
  },
  {
    id: 20,
    title: 'Завдання 20 — FizzBuzz',
    code: `def fizzbuzz(n):
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)`,
  },
];
