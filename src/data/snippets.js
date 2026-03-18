export const SNIPPETS = [
  {
    id: 21,
    title: 'Завдання 21 — Додаток: Журнал оцінок',
    code: `students = {}
  def add_student(name):
    if name not in students:
        students[name] = []
        print(f"Student '{name}' added.")
    else:
        print("Student already exists.")


def add_grade(name, grade):
    if name not in students:
        print("Student not found.")
        return

    if not (0 <= grade <= 100):
        print("Grade must be between 0 and 100.")
        return

    students[name].append(grade)
    print(f"Grade {grade} added for {name}.")


def get_average(grades):
    if not grades:
        return 0

    total = sum(grades)
    count = len(grades)

    return total / count


def letter_grade(avg):
    if avg >= 90:
        return "A"

    elif avg >= 75:
        return "B"

    elif avg >= 60:
        return "C"

    elif avg >= 50:
        return "D"

    else:
        return "F"


def show_report():
    if not students:
        print("No students found.")
        return

    print("\n=== Grade Report ===")

    for name, grades in students.items():
        avg = get_average(grades)
        letter = letter_grade(avg)
        count = len(grades)

        print(f"{name}:")
        print(f"  grades = {grades}")
        print(f"  average = {avg:.1f}")
        print(f"  letter = {letter}")
        print(f"  count = {count}")
        print("-" * 30)

    print()


def top_student():
    if not students:
        print("No students yet.")
        return

    best = max(
        students,
        key=lambda n: get_average(students[n])
    )

    avg = get_average(students[best])
    letter = letter_grade(avg)

    print("Top student:")
    print(f"Name: {best}")
    print(f"Average: {avg:.1f}")
    print(f"Letter: {letter}")


def class_average():
    all_grades = []

    for grades in students.values():
        for g in grades:
            all_grades.append(g)

    if not all_grades:
        print("No grades yet.")
        return

    total = sum(all_grades)
    count = len(all_grades)

    avg = total / count
    letter = letter_grade(avg)

    print("Class average:")
    print(f"Value: {avg:.1f}")
    print(f"Letter: {letter}")


def remove_student(name):
    if name in students:
        del students[name]
        print(f"Student '{name}' removed.")
    else:
        print("Student not found.")


def show_menu():
    print("\n=== Gradebook ===")

    print("1. Add student")
    print("2. Add grade")
    print("3. Show report")

    print("4. Top student")
    print("5. Class average")
    print("6. Remove student")

    print("0. Exit")


def run():
    while True:
        show_menu()

        choice = input("Choice: ").strip()

        if choice == "1":
            name = input("Name: ").strip()
            add_student(name)

        elif choice == "2":
            name = input("Name: ").strip()

            try:
                grade_input = input("Grade (0-100): ")
                grade = float(grade_input)

                add_grade(name, grade)

            except ValueError:
                print("Invalid grade.")

        elif choice == "3":
            show_report()

        elif choice == "4":
            top_student()

        elif choice == "5":
            class_average()

        elif choice == "6":
            name = input("Name: ").strip()
            remove_student(name)

        elif choice == "0":
            print("Goodbye!")
            break

        else:
            print("Invalid choice.")


if __name__ == "__main__":
    run()
`,
  },
];
