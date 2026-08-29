export interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  descriptionKey: string;
  params?:
    | {
        name?: string;
        required?: boolean;
        descriptionKey?: string;
      }[]
    | null;
  requestExample?: string | null;
  successExample?: string | null;
  errorExample?: string | null;
}

const apiEndpoints: Endpoint[] = [
  {
    method: "GET",
    path: "/api",
    descriptionKey: "api.endpointsData.apiStatus",
    params: null,
    successExample: `{
  "data": { "status": "ok" },
  "message": "API server is running"
}`,
    errorExample: null,
  },
  {
    method: "GET",
    path: "/api/v1",
    descriptionKey: "api.endpointsData.apiV1Status",
    params: null,
    successExample: `{
  "data": { "status": "ok" },
  "message": "API v1 server is running"
}`,
    errorExample: null,
  },
  {
    method: "GET",
    path: "/api/v1/universities",
    descriptionKey: "api.endpointsData.getAllUniversities",
    params: null,
    successExample: `{
  "message": "Universities retrieved successfully.",
  "data": [
    {
      "id": 1, "name": "University of Sarajevo", "acronym": "UNSA",
      "city": "Sarajevo", "entity": "FBIH", "ownership": "PUBLIC",
      "foundedYear": "1949", "website": "https://unsa.ba",
      "_count": { "faculties": 23 }
    },
    ...
  ]
}`,
    errorExample: null,
  },
  {
    method: "GET",
    path: "/api/v1/universities/:id",
    descriptionKey: "api.endpointsData.getUniversityById",
    params: null,
    successExample: `{
  "message": "University retrieved successfully.",
  "data": {
    "id": 1, "name": "University of Sarajevo", "acronym": "UNSA",
    "city": "Sarajevo", "entity": "FBIH", "ownership": "PUBLIC",
    "foundedYear": "1949", "website": "https://unsa.ba",
    "address": "Obala Kulina bana 7/II, 71000 Sarajevo",
    "phone": "+387 33 565 100", "email": "javnost@unsa.ba",
    "faculties": [
      { "id": 1, "name": "Faculty of Science",
        "city": "Sarajevo", "website": "https://pmf.unsa.ba",
        "studyPrograms": [
          { "id": 1, "name": "Computer Science", "cycle": "FIRST",
            "subjects": [ ... ], "tracks": [ ... ]
          }
        ]
      }
    ]
  }
}`,
    errorExample: `// 404
{ "error": { "message": "University not found." } }`,
  },
  {
    method: "GET",
    path: "/api/v1/search",
    descriptionKey: "api.endpointsData.search",
    params: [
      {
        name: "searchTerm",
        required: true,
        descriptionKey: "api.endpointsData.searchTermParam",
      },
    ],
    successExample: `{
  "message": "Search results retrieved successfully.",
  "data": {
    "universities": [
      { "id": 1, "name": "University of Sarajevo", "acronym": "UNSA",
        "city": "Sarajevo", "entity": "FBIH", "ownership": "PUBLIC",
        "_count": { "faculties": 23 }
      }
    ],
    "faculties": [
      { "id": 1, "name": "Faculty of Electrical Engineering", "city": "Sarajevo",
        "university": { "id": 1, "name": "University of Sarajevo", "acronym": "UNSA" }
      }
    ],
    "studyPrograms": [
      { "id": 1, "name": "Software Engineering", "cycle": "FIRST", "ects": 180,
        "faculty": { "id": 1, "name": "Faculty of Electrical Engineering",
          "university": { "id": 1, "name": "University of Sarajevo" }
        }
      }
    ],
    "tracks": [
      { "id": 1, "name": "Software Development", "ects": 60,
        "studyProgram": { "id": 1, "name": "Software Engineering",
          "faculty": { "id": 1, "name": "Faculty of Electrical Engineering",
            "university": { "id": 1, "name": "University of Sarajevo" }
          }
        }
      }
    ],
    "subjects": [
      { "id": 1, "name": "Computer Networks", "semester": 4, "ects": 6,
        "type": "MANDATORY",
        "studyProgram": { "id": 1, "name": "Software Engineering",
          "faculty": { "id": 1, "name": "Faculty of Electrical Engineering",
            "university": { "id": 1, "name": "University of Sarajevo" }
          }
        }
      }
    ]
  }
}`,
    errorExample: `// 404 - no match found
{ "error": { "message": "No results found matching your search." } }

// 400 - invalid searchTerm
{ "error": { "message": "Request validation failed." } }`,
  },
];

export { apiEndpoints };
