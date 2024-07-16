import { FileSystemTree } from "@webcontainer/api";

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

const mochaTest = `
import { expect } from 'chai';
import { addTwo, map } from './source.js';

describe('addTwo', function () {
  it("should be a function", function () { 
    expect(addTwo).to.be.a('function');
  });
  it("should add two to a number", function () { 
    expect(addTwo(2)).to.equal(4);
  });
});
`;

const mochaConfig = `{
  "reporter": "json",
  "reporterOptions": [
    "output=./test-results.json"
  ]
}`;

const packageJSON = JSON.stringify({
  name: "codilla",
  type: "module",
  dependencies: {
    chai: "^5.1.1",
    mocha: "^10.6.0",
  },
  scripts: {
    test: "mocha test.js",
  },
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
  ".mocharc.json": {
    file: {
      contents: mochaConfig,
    },
  },
  "test.js": {
    file: {
      contents: mochaTest,
    },
  },
};
