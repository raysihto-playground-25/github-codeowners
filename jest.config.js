module.exports = {
    "roots": [
        "./src"
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "testEnvironment": "node",
    "reporters": [
        "default",
        "jest-junit"
    ],
    "coverageReporters": [
        "html",
        "lcov",
        "text"
    ],
    "coverageDirectory": "./tests/reports/unit/coverage",
    "collectCoverageFrom": [
        "src/**/*.ts"
    ],
    "coveragePathIgnorePatterns": [
        "__mock__",
        ".test.int.ts"
    ]
};
