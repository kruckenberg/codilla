from itertools import groupby
import markdown
from django.http import Http404, HttpResponseServerError, JsonResponse
from django.shortcuts import redirect, render
from .models import Challenge
from .importer.build_courses import courses


def get_course(course_slug):
    course = courses.get(course_slug)

    if not course:
        raise Http404()

    return course


def courses_index(request):
    return render(
        request,
        "code_challenge/courses.html",
        context={"courses": list(courses.values())},
    )


def course_view(request, course_slug=""):
    completed_lessons = Challenge.objects.filter(
        user=request.user, course_slug=course_slug, completed=True
    )
    course = get_course(course_slug)

    completed_by_unit = {
        key: [challenge.lesson_id for challenge in list(group)]
        for key, group in groupby(completed_lessons, lambda x: x.unit_slug)
    }
    lessons_by_unit = [
        [
            unit,
            [lesson for lesson in unit.get_lessons()],
            completed_by_unit.get(unit.slug),
        ]
        for unit in course.get_units()
    ]

    return render(
        request,
        "code_challenge/course_view.html",
        context={
            "course": course,
            "lessons_by_unit": lessons_by_unit,
        },
    )


def units_redirect(request, course_slug="", unit_slug=""):
    return redirect("units", course_slug=course_slug)


def lesson(request, course_slug="", unit_slug="", lesson_slug=""):
    course = get_course(course_slug)
    lesson = course.get_lesson(unit_slug, lesson_slug)

    if not lesson:
        raise Http404()

    if request.user.is_authenticated:
        challenge, _ = Challenge.objects.get_or_create(
            user=request.user,
            course_slug=course_slug,
            unit_slug=unit_slug,
            lesson_slug=lesson_slug,
        )
    else:
        challenge = Challenge(completed=False)

    if lesson.type == "editor":
        return render_editor(request, lesson, challenge)
    if lesson.type == "repl":
        return render_terminal(request, lesson, challenge)

    return HttpResponseServerError(
        b"Oops. Something went wrong. Reloading the page is unlikely to help."
    )


def render_editor(request, lesson, challenge):
    context = {
        "challenge": {
            "title": lesson.title,
            "lesson_id": lesson.id,
            "completed": challenge.completed,
            "file_system": lesson.create_file_system(challenge.code or None),
            "starter_code": lesson.source_file,
            "instructions": markdown.markdown(
                lesson.instructions_file, extensions=["fenced_code", "codehilite"]
            ),
        }
    }

    return render(request, "code_challenge/editor.html", context=context)


def render_terminal(request, lesson, challenge):
    context = {
        "challenge": {
            "title": lesson.title,
            "lesson_id": lesson.id,
            "completed": challenge.completed,
            "instructions": markdown.markdown(
                lesson.instructions_file, extensions=["fenced_code", "codehilite"]
            ),
            "has_tests": lesson.tests,
        }
    }

    return render(request, "code_challenge/terminal.html", context=context)
