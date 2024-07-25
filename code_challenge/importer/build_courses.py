import os
from django.conf import settings
from ..importer.parsers import Course, Unit, Lesson


def build_course(course_dir: str) -> Course:
    course = Course(course_dir)

    unit_dirs = sorted(
        [
            os.path.join(course_dir, unit_dir)
            for unit_dir in os.listdir(course_dir)
            if os.path.isdir(os.path.join(course_dir, unit_dir))
            and not unit_dir.startswith(".")
        ]
    )

    for unit_dir in unit_dirs:
        unit = Unit(unit_dir, course)
        course.add_unit(unit)
        for lesson_dir in sorted(os.listdir(unit_dir)):
            if os.path.isdir(os.path.join(unit_dir, lesson_dir)):
                lesson = Lesson(os.path.join(unit_dir, lesson_dir), unit)
                unit.add_lesson(lesson)

    return course


def get_courses():
    courses_root = settings.COURSE_ROOT

    course_dirs = sorted(
        [
            os.path.join(courses_root, course_dir)
            for course_dir in os.listdir(courses_root)
            if os.path.isdir(os.path.join(courses_root, course_dir))
            and not course_dir.startswith(".")
        ]
    )

    courses = {}

    for course_dir in course_dirs:
        course = build_course(course_dir)
        courses[course.slug] = course

    return courses


courses = get_courses()
