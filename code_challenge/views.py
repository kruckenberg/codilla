from django.shortcuts import render
import markdown


def index(request):
    with open("code_challenge/challenges/map.md", "r", encoding="utf-8") as file:
        instructions_markdown = file.read()
    starter_code = """function subtractTwo(num) {\n  // your code here\n}\n\nfunction map(arr, callback) {\n  // your code here\n}"""

    context = {
        "challenge": {
            "title": "map",
            "instructions": markdown.markdown(
                instructions_markdown, extensions=["fenced_code", "codehilite"]
            ),
            "starter_code": starter_code,
        }
    }

    return render(request, "code_challenge/index.html", context=context)


def terminal(request):
    with open(
        "code_challenge/challenges/fancy_calculator.md", "r", encoding="utf-8"
    ) as file:
        instructions_markdown = file.read()

    context = {
        "challenge": {
            "title": "A fancy calculator",
            "instructions": markdown.markdown(instructions_markdown),
        }
    }

    return render(request, "code_challenge/terminal.html", context=context)
