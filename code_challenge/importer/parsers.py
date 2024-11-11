import os
import json


class Lesson:
    def __init__(self, directory: str, parent):
        self.parent = parent
        self.previous = None
        self.next = None

        try:
            with open(os.path.join(directory, "meta.json"), "r") as file:
                self._metadata = file.read()
            self._metadata = json.loads(self._metadata)
        except FileNotFoundError:
            raise ValueError("Could not find meta.json in %s" % directory)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON metadata")

        self.title = self._metadata.get("title")
        self.slug = self._metadata.get("slug")
        self.language = self._metadata.get("language")
        self.type = self._metadata.get("type")
        self.version = self._metadata.get("version")
        self.tests = self._metadata.get("tests")
        self.exports = self._metadata.get("exports")
        self.link = f"{parent.link}/{self.slug}"
        self.id = self.link[1:]

        self.source_file = self.read_file(directory, "source")
        self.test_file = self.read_file(directory, "test")
        self.instructions_file = self.read_file(directory, "instructions")

        if self.language == "html":
            self.style_file = self.read_file(directory, "style")
            self.script_file = self.read_file(directory, "script")

    def read_file(self, directory: str, file_type: str):
        filename_by_type = {
            "html": {
                "instructions": "instructions.md",
                "source": "source.html",
                "style": "styles.css",
                "script": "script.js",
                "test": "test.js",
            },
            "javascript": {
                "instructions": "instructions.md",
                "source": "source.js",
                "test": "test.js",
            },
            "python": {
                "instructions": "instructions.md",
                "source": "source.py",
                "test": "test.py",
            },
        }

        filename = filename_by_type.get(self.language, {}).get(file_type)

        if not filename:
            return ""

        path = os.path.join(directory, filename)

        try:
            with open(path, "r") as file:
                return file.read()
        except FileNotFoundError:
            return ""

    def create_file_system(self, saved_code: str | None):
        if self.type == "repl":
            return {}
        if self.language == "html":
            return self.create_file_system_html(saved_code)
        if self.language == "javascript":
            return self.create_file_system_javascript(saved_code)
        if self.language == "python":
            return self.create_file_system_python(saved_code)

    def create_file_system_html(self, saved_code: str | None):
        try:
            parsed_saved_code = json.loads(saved_code or "")
        except json.JSONDecodeError:
            parsed_saved_code = {"html": saved_code, "css": "", "js": ""}

        packageJSON = json.dumps(
            {
                "name": "codilla",
                "type": "module",
                "dependencies": {
                    "chai": "^5.1.1",
                    "mocha": "^10.6.0",
                    "vite": "^5.4.0",
                },
                "scripts": {
                    "test": "mocha test.js",
                    "start": "vite --port 3111",
                },
            }
        )

        mochaConfig = json.dumps(
            {"reporter": "json", "reporterOptions": ["output=./test-results.json"]}
        )

        return {
            "package.json": {
                "file": {
                    "contents": packageJSON,
                },
            },
            ".mocharc.json": {
                "file": {
                    "contents": mochaConfig,
                },
            },
            "index.html": {
                "file": {
                    "contents": parsed_saved_code["html"] or self.source_file,
                },
            },
            "styles.css": {
                "file": {
                    "contents": parsed_saved_code["css"] or self.style_file,
                },
            },
            "script.js": {
                "file": {
                    "contents": parsed_saved_code["js"] or self.script_file,
                },
            },
            "test.js": {
                "file": {
                    "contents": self.test_file,
                },
            },
        }

    def create_file_system_javascript(self, saved_code: str | None):
        mochaConfig = json.dumps(
            {"reporter": "json", "reporterOptions": ["output=./test-results.json"]}
        )

        packageJSON = json.dumps(
            {
                "name": "codilla",
                "type": "module",
                "dependencies": {
                    "chai": "^5.1.1",
                    "mocha": "^10.6.0",
                },
                "scripts": {
                    "test": "mocha test.js",
                },
            }
        )

        return {
            "source.js": {
                "file": {
                    "contents": saved_code or self.source_file,
                },
            },
            "package.json": {
                "file": {
                    "contents": packageJSON,
                },
            },
            ".mocharc.json": {
                "file": {
                    "contents": mochaConfig,
                },
            },
            "test.js": {
                "file": {
                    "contents": self.test_file,
                },
            },
        }

    def create_file_system_python(self, saved_code: str | None):
        return {
            "source.py": {
                "file": {
                    "contents": saved_code or self.source_file,
                },
            },
            "test.py": {
                "file": {
                    "contents": self.test_file,
                },
            },
        }


class Unit:
    def __init__(self, directory: str, parent):
        self.parent = parent
        self.previous = None
        self.next = None

        try:
            with open(os.path.join(directory, "meta.json"), "r") as file:
                self._metadata = file.read()
            self._metadata = json.loads(self._metadata)
        except FileNotFoundError:
            raise ValueError("Could not find meta.json in %s" % directory)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON metadata")

        self.title = self._metadata.get("title")
        self.slug = self._metadata.get("slug")
        self.link = f"{parent.link}/{self.slug}"
        self._lessons = []

    def add_lesson(self, lesson: Lesson):
        if len(self._lessons) > 0:
            lesson.previous = self._lessons[-1]
            self._lessons[-1].next = lesson
        self._lessons.append(lesson)

    def get_lesson(self, slug: str):
        for lesson in self._lessons:
            if lesson.slug == slug:
                return lesson

    def get_lessons(self):
        return self._lessons

    @property
    def number_of_lessons(self):
        return len(self._lessons)


class Course:
    def __init__(self, directory: str):
        try:
            with open(os.path.join(directory, "meta.json"), "r") as file:
                self._metadata = file.read()
            self._metadata = json.loads(self._metadata)
        except FileNotFoundError:
            raise ValueError("Could not find meta.json in %s" % directory)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON metadata")

        self.title = self._metadata.get("title")
        self.slug = self._metadata.get("slug")
        self.version = self._metadata.get("version")
        self.link = f"/{self.slug}"
        self._units = []

    def add_unit(self, unit):
        if len(self._units) > 0:
            unit.previous = self._units[-1]
            self._units[-1].next = unit
        self._units.append(unit)

    def get_lesson(self, unit_slug: str, lesson_slug: str):
        unit = self.get_unit(unit_slug)
        if not unit:
            return None
        return unit.get_lesson(lesson_slug)

    def get_unit(self, slug: str):
        for unit in self._units:
            if unit.slug == slug:
                return unit

    def get_units(self):
        return self._units

    @property
    def number_of_units(self):
        return len(self._units)
