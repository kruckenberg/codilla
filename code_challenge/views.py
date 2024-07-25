from django.http import Http404, HttpResponseServerError
from django.shortcuts import render
import markdown
from .importer.build_courses import courses


def index(request, course_slug="", unit_slug=""):
    intro_javascript = {
        "title": "Introduction to JavaScript",
        "units": [
            {
                "title": "Explore",
                "lessons": [
                    "REPL: A fancy calculator",
                    "REPL Wiz",
                    "REPL: recalling the last value",
                ],
            },
            {
                "title": "Data Types",
                "lessons": ["strings", "numbers", "booleans", "null and undefined"],
            },
        ],
        "status": "in progress",
    }

    intro_html = {
        "title": "Introduction to HTML",
        "units": [
            {
                "title": "How the Web Works",
                "lessons": ["the internet", "the web", "request-response cycle"],
            },
            {"title": "hyptertext", "lessons": ["HTML", "elements", "attributes"]},
            {"title": "structure", "lessons": ["head", "body", "title"]},
            {"title": "text", "lessons": ["headings", "paragraphs", "lists"]},
        ],
        "status": "completed",
    }

    courses = [intro_javascript, intro_html, intro_javascript, intro_html]

    if not course_slug:
        return render(
            request, "code_challenge/courses.html", context={"courses": courses}
        )

    return render(request, "code_challenge/index.html")


def lesson(request, course_slug="", unit_slug="", lesson_slug=""):
    course = courses[course_slug]

    if not course:
        raise Http404("Lesson not found")

    lesson = course.get_lesson(unit_slug, lesson_slug)

    if not lesson:
        raise Http404("Lesson not found")

    if lesson.type == "editor":
        return render_editor(request, lesson)
    if lesson.type == "repl":
        return render_terminal(request, lesson)

    return HttpResponseServerError(
        b"Oops. Something went wrong. Reloading the page is unlikely to help."
    )


def render_editor(request, lesson):
    context = {
        "challenge": {
            "title": lesson.title,
            "instructions": markdown.markdown(
                lesson.instructionsFile, extensions=["fenced_code", "codehilite"]
            ),
            "starter_code": lesson.sourceFile,
        }
    }

    return render(request, "code_challenge/editor.html", context=context)


def render_terminal(request, lesson):
    context = {
        "challenge": {
            "title": lesson.title,
            "instructions": markdown.markdown(
                lesson.instructionsFile, extensions=["fenced_code", "codehilite"]
            ),
        }
    }

    return render(request, "code_challenge/terminal.html", context=context)
