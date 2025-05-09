const { expect } = require("chai");
const {
  patchResources,
  collectResourceMap,
  pruneResources,
} = require("../index.js");

const sampleData = {
  departments: [
    {
      id: 1,
      integrity: "02d3776dbc8e7abd78997b6d8ea91097",
      name: "Engineering",
      employees: [
        {
          id: 101,
          integrity: "d41d8cd98f00b204e9800998ecf8427e",
          name: "Alice",
          position: "Engineer",
          level: {
            name: "Junior",
            id: 1,
            integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
          },
        },
        {
          id: 102,
          integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
          name: "Bob",
          position: "Senior Engineer",
          level: {
            id: 2,
            integrity: "c86736d84bf5234f41394cd596965754",
            name: "Senior",
          },
        },
      ],
    },
    {
      id: 2,
      name: "HR",
      employees: [
        {
          id: 201,
          integrity: "202cb962ac59075b964b07152d234b70",
          name: "Charlie",
          position: "HR Manager",
          level: {
            id: 1,
            integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
            name: "Junior",
          },
        },
      ],
    },
  ],
};

describe("resource-state-management", () => {
  it("filters a deeply nested object with a matching integrity key", () => {
    expect({
      departments: [
        {
          id: 1,
          name: "Engineering",
          integrity: "02d3776dbc8e7abd78997b6d8ea91097",
          employees: [
            {
              id: 101,
              name: "Alice",
              position: "Engineer",
              integrity: "d41d8cd98f00b204e9800998ecf8427e",
              level: {
                name: "Junior",
                id: 1,
                integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
              },
            },
            {
              id: 102,
              name: "Bob",
              position: "Senior Engineer",
              integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
            },
          ],
        },
        {
          id: 2,
          name: "HR",
          employees: [
            {
              id: 201,
              name: "Charlie",
              position: "HR Manager",
              integrity: "202cb962ac59075b964b07152d234b70",
              level: {
                name: "Junior",
                id: 1,
                integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
              },
            },
          ],
        },
      ],
    }).to.deep.eq(
      pruneResources({ ...sampleData }, "c86736d84bf5234f41394cd596965754")
    );
  });

  it("replaces a deeply nested object based on integrity key", () => {
    expect({
      departments: [
        {
          id: 1,
          integrity: "02d3776dbc8e7abd78997b6d8ea91097",
          name: "Engineering",
          employees: [
            {
              id: 101,
              integrity: "d41d8cd98f00b204e9800998ecf8427e",
              name: "Alice",
              position: "Engineer",
              level: {
                name: "Junior",
                id: 1,
                integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
              },
            },
            {
              id: 102,
              integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
              name: "Bob",
              position: "Senior Engineer",
              level: {
                name: "Senior Engineer",
                id: 2,
                integrity: "c86736d84bf5234f41394cd596965754",
              },
            },
          ],
        },
        {
          id: 2,
          name: "HR",
          employees: [
            {
              id: 201,
              integrity: "202cb962ac59075b964b07152d234b70",
              name: "Charlie",
              position: "HR Manager",
              level: {
                name: "Junior",
                id: 1,
                integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
              },
            },
          ],
        },
      ],
    }).to.deep.eq(
      patchResources(
        { ...sampleData },
        collectResourceMap({
          name: "Senior Engineer",
          id: 2,
          integrity: "c86736d84bf5234f41394cd596965754",
        })
      )
    );
  });

  it("removes multiple matching objects in different branches", () => {
    const filtered = pruneResources(
      { ...sampleData },
      "b5eb53703d4d1fff8bfafaf21a66d95a"
    );
    expect(filtered).to.deep.eq({
      departments: [
        {
          id: 1,
          integrity: "02d3776dbc8e7abd78997b6d8ea91097",
          name: "Engineering",
          employees: [
            {
              id: 101,
              integrity: "d41d8cd98f00b204e9800998ecf8427e",
              name: "Alice",
              position: "Engineer",
            },
            {
              id: 102,
              integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
              name: "Bob",
              position: "Senior Engineer",
              level: {
                id: 2,
                integrity: "c86736d84bf5234f41394cd596965754",
                name: "Senior",
              },
            },
          ],
        },
        {
          id: 2,
          name: "HR",
          employees: [
            {
              id: 201,
              integrity: "202cb962ac59075b964b07152d234b70",
              name: "Charlie",
              position: "HR Manager",
            },
          ],
        },
      ],
    });
  });

  it("returns identical object if no integrity key matches", () => {
    const untouched = pruneResources({ ...sampleData }, "nonexistent-key");
    expect(untouched).to.deep.equal(sampleData);
  });

  it("removes entire nested objects if only child had integrity match", () => {
    expect(
      pruneResources({ ...sampleData }, "02d3776dbc8e7abd78997b6d8ea91097")
    ).to.deep.eq({
      departments: [
        {
          id: 2,
          name: "HR",
          employees: [
            {
              id: 201,
              integrity: "202cb962ac59075b964b07152d234b70",
              name: "Charlie",
              position: "HR Manager",
              level: {
                id: 1,
                integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
                name: "Junior",
              },
            },
          ],
        },
      ],
    });
  });

  it("extracts all objects with integrity key into a Map", () => {
    const map = collectResourceMap(sampleData);
    expect(map.size).to.equal(6);
  });

  it("replaces multiple nested objects with data from a map", () => {
    const map = collectResourceMap([
      {
        id: 101,
        integrity: "d41d8cd98f00b204e9800998ecf8427e",
        name: "Alice Smith",
        position: "Engineer",
        level: null,
      },
      {
        id: 102,
        integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
        name: "Bob Doe",
        position: "Senior Engineer",
      },
    ]);

    expect(patchResources({ ...sampleData }, map)).to.deep.eq({
      departments: [
        {
          id: 1,
          integrity: "02d3776dbc8e7abd78997b6d8ea91097",
          name: "Engineering",
          employees: [
            {
              id: 101,
              integrity: "d41d8cd98f00b204e9800998ecf8427e",
              name: "Alice Smith",
              position: "Engineer",
              level: null,
            },
            {
              id: 102,
              integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
              name: "Bob Doe",
              position: "Senior Engineer",
              level: {
                id: 2,
                integrity: "c86736d84bf5234f41394cd596965754",
                name: "Senior",
              },
            },
          ],
        },
        {
          id: 2,
          name: "HR",
          employees: [
            {
              id: 201,
              integrity: "202cb962ac59075b964b07152d234b70",
              name: "Charlie",
              position: "HR Manager",
              level: {
                id: 1,
                integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
                name: "Junior",
              },
            },
          ],
        },
      ],
    });
  });

  it("replaces multiple nested objects with data from a map", () => {
    const map = collectResourceMap([
      {
        id: 101,
        integrity: "d41d8cd98f00b204e9800998ecf8427e",
        name: "Alice Smith",
        position: "Engineer",
        level: null,
      },
      {
        id: 102,
        integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
        name: "Bob Doe",
        position: "Senior Engineer",
      },
    ]);

    expect(patchResources({ ...sampleData }, map)).to.deep.eq({
      departments: [
        {
          id: 1,
          integrity: "02d3776dbc8e7abd78997b6d8ea91097",
          name: "Engineering",
          employees: [
            {
              id: 101,
              integrity: "d41d8cd98f00b204e9800998ecf8427e",
              name: "Alice Smith",
              position: "Engineer",
              level: null,
            },
            {
              id: 102,
              integrity: "e991f6971c9d76afa747cb43d4f7bd2d",
              name: "Bob Doe",
              position: "Senior Engineer",
              level: {
                id: 2,
                integrity: "c86736d84bf5234f41394cd596965754",
                name: "Senior",
              },
            },
          ],
        },
        {
          id: 2,
          name: "HR",
          employees: [
            {
              id: 201,
              integrity: "202cb962ac59075b964b07152d234b70",
              name: "Charlie",
              position: "HR Manager",
              level: {
                id: 1,
                integrity: "b5eb53703d4d1fff8bfafaf21a66d95a",
                name: "Junior",
              },
            },
          ],
        },
      ],
    });
  });

  it("remove object by integrity but keep falsy values", () => {
    expect(
      pruneResources(
        [
          { id: 1, integrity: "abc123" },
          "",
          false,
          [false],
          null,
          [null],
          undefined,
          [undefined],
          [undefined, 0, { key: undefined }],
          { id: 2, integrity: "def456" },
        ],
        "abc123"
      )
    ).to.deep.equal([
      "",
      false,
      [false],
      null,
      [null],
      [],
      [0, {}],
      { id: 2, integrity: "def456" },
    ]);
  });
});
