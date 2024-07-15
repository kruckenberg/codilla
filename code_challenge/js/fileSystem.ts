import { FileSystemTree } from "@webcontainer/api";
import testUtils from "./testUtils.js";
import testRunner from "./testRunner.js";

const starterCode = `
function addTwo(num) {
  return num + 2;
}

function map(arr, callback) {
  const mappedArr = [];
  
  for (let elem of arr) {
    console.log({ elem });
    mappedArr.push(callback(elem));
  }

  return mappedArr;
}

console.log(map([1, 2, 3], addTwo));`.trim();

const testCode = `
import { run, test } from './testRunner.js';
import { isFunction, evaluatesTo } from './testUtils.js';
import { addTwo, map } from './source.js';

test('addTwo should be a function', isFunction(addTwo));
test('addTwo should add two to a number', evaluatesTo(addTwo, [2], 4));
test('map should be a function', isFunction(map));
// test('map should map an array', evaluatesTo(map, [[1, 2, 3], addTwo], [3, 4, 5]));
run();`;

const packageJSON = JSON.stringify({
  name: "codilla",
  type: "module",
  dependencies: {},
  scripts: {},
});

export const files: FileSystemTree = {
  "source.js": {
    file: {
      contents: starterCode,
    },
  },
  "package.json": {
    file: {
      contents: packageJSON,
    },
  },
  "test.js": {
    file: {
      contents: testCode,
    },
  },
  "testRunner.js": {
    file: {
      contents: testRunner,
    },
  },
  "testUtils.js": {
    file: {
      contents: testUtils,
    },
  },
};
