import os
import json


class Lesson:
    def __init__(self, directory: str):
        try:
            with open(os.path.join(directory, "meta.json"), "r") as file:
                self._metadata = file.read()
            self._metadata = json.loads(self._metadata)
        except FileNotFoundError:
            raise ValueError("Could not find meta.json in %s" % directory)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON metadata")

        self.title = self._metadata["title"]
        self.slug = self._metadata["slug"]
        self.type = self._metadata["type"]
        self.version = self._metadata["version"]
        self.tests = self._metadata["tests"]

        self.sourceFile = self.read_file(os.path.join(directory, "source.js"))
        self.testFile = self.read_file(os.path.join(directory, "test.js"))
        self.instructionsFile = self.read_file(
            os.path.join(directory, "instructions.md")
        )

    def read_file(self, filename):
        try:
            with open(filename, "r") as file:
                return file.read()
        except FileNotFoundError:
            return None


class Unit:
    def __init__(self, directory: str):
        try:
            with open(os.path.join(directory, "meta.json"), "r") as file:
                self._metadata = file.read()
            self._metadata = json.loads(self._metadata)
        except FileNotFoundError:
            raise ValueError("Could not find meta.json in %s" % directory)
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON metadata")

        self.title = self._metadata["title"]
        self.slug = self._metadata["slug"]
        self._lessons = []

    def add_lesson(self, lesson: Lesson):
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

        self.title = self._metadata["title"]
        self.slug = self._metadata["slug"]
        self.version = self._metadata["version"]
        self._units = []

    def add_unit(self, unit):
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
