from django.shortcuts import render
import markdown


def index(request):
    instructions_text = """Create a function subtractTwo that accepts number and returns that number minus 2.
    <br><br>
    Then create a function <code>map</code> that takes two arguments:
    <ul>
      <li>an array of numbers</li>
      <li>a callback function - this function is applied to each element of the array (from left to right) and the results are stored in a new array</li>
    </ul>
    <br><br>
    Have your <code>map</code> function return a new array filled with numbers that are the result of the callback function on each element of the input array. Please do not use the native <code>map</code> or <code>forEach</code> functions.
    """

    starter_code = """function subtractTwo(num) {\n  // your code here\n}\n\nfunction map(arr, callback) {\n  // your code here\n}"""

    context = {
        "challenge": {
            "title": "map",
            "instructions": instructions_text,
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
