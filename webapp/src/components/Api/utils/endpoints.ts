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

const notFoundError = (entity: string) =>
  `// 404\n{ "error": { "code": "NOT_FOUND", "message": "${entity} not found." } }`;

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
            "tracks": [ ... ]
          }
        ]
      }
    ]
  }
}`,
    errorExample: notFoundError("University"),
  },
  {
    method: "GET",
    path: "/api/v1/faculties",
    descriptionKey: "api.endpointsData.getAllFaculties",
    params: null,
    successExample: `{
  "message": "Faculties retrieved successfully.",
  "data": [
    {
      "id": 1, "name": "Faculty of Electrical Engineering",
      "city": "Sarajevo", "website": "https://etf.unsa.ba",
      "university": { "id": 1, "name": "University of Sarajevo", "acronym": "UNSA" }
    },
    ...
  ]
}`,
    errorExample: null,
  },
  {
    method: "GET",
    path: "/api/v1/faculties/:id",
    descriptionKey: "api.endpointsData.getFacultyById",
    params: null,
    successExample: `{
  "message": "Faculty retrieved successfully.",
  "data": {
    "id": 1, "name": "Faculty of Electrical Engineering",
    "city": "Sarajevo", "website": "https://etf.unsa.ba",
    "university": { "id": 1, "name": "University of Sarajevo", "acronym": "UNSA" },
    "studyPrograms": [
      { "id": 1, "name": "Computer Science", "cycle": "FIRST",
        "tracks": [ ... ]
      }
    ]
  }
}`,
    errorExample: notFoundError("Faculty"),
  },
  {
    method: "GET",
    path: "/api/v1/study-programs",
    descriptionKey: "api.endpointsData.getAllStudyPrograms",
    params: null,
    successExample: `{
  "message": "Study programs retrieved successfully.",
  "data": [
    {
      "id": 1, "name": "Software Engineering", "cycle": "FIRST", "ects": 180,
      "faculty": { "id": 1, "name": "Faculty of Electrical Engineering",
        "university": { "id": 1, "name": "University of Sarajevo" }
      }
    },
    ...
  ]
}`,
    errorExample: null,
  },
  {
    method: "GET",
    path: "/api/v1/study-programs/:id",
    descriptionKey: "api.endpointsData.getStudyProgramById",
    params: null,
    successExample: `{
  "message": "Study program retrieved successfully.",
  "data": {
    "id": 1, "name": "Software Engineering", "cycle": "FIRST", "ects": 180,
    "faculty": { "id": 1, "name": "Faculty of Electrical Engineering",
      "university": { "id": 1, "name": "University of Sarajevo" }
    },
    "tracks": [
      { "id": 1, "name": "Software Development", "ects": 60 }
    ]
  }
}`,
    errorExample: notFoundError("Study program"),
  },
  {
    method: "GET",
    path: "/api/v1/tracks",
    descriptionKey: "api.endpointsData.getAllTracks",
    params: null,
    successExample: `{
  "message": "Tracks retrieved successfully.",
  "data": [
    {
      "id": 1, "name": "Software Development", "ects": 60,
      "studyProgram": { "id": 1, "name": "Software Engineering",
        "faculty": { "id": 1, "name": "Faculty of Electrical Engineering",
          "university": { "id": 1, "name": "University of Sarajevo" }
        }
      }
    },
    ...
  ]
}`,
    errorExample: null,
  },
  {
    method: "GET",
    path: "/api/v1/tracks/:id",
    descriptionKey: "api.endpointsData.getTrackById",
    params: null,
    successExample: `{
  "message": "Track retrieved successfully.",
  "data": {
    "id": 1, "name": "Software Development", "ects": 60,
    "studyProgram": { "id": 1, "name": "Software Engineering",
      "faculty": { "id": 1, "name": "Faculty of Electrical Engineering",
        "university": { "id": 1, "name": "University of Sarajevo" }
      }
    }
  }
}`,
    errorExample: notFoundError("Track"),
  },
  {
    method: "GET",
    path: "/api/v1/search",
    descriptionKey: "api.endpointsData.search",
    params: [
      {
        name: "searchTerm",
        required: false,
        descriptionKey: "api.endpointsData.searchTermParam",
      },
      {
        name: "entity",
        required: false,
        descriptionKey: "api.endpointsData.entityParam",
      },
      {
        name: "ownership",
        required: false,
        descriptionKey: "api.endpointsData.ownershipParam",
      },
      {
        name: "cycle",
        required: false,
        descriptionKey: "api.endpointsData.cycleParam",
      },
      {
        name: "type",
        required: false,
        descriptionKey: "api.endpointsData.typeParam",
      },
    ],
    successExample: `{
  "message": "Search results retrieved successfully.",
  "data": {
    "universities": [ ... ],
    "faculties": [ ... ],
    "studyPrograms": [ ... ],
    "totals": { "universities": 4, "faculties": 20, "studyPrograms": 221 },
    "direct": { "universities": 4, "faculties": 20, "studyPrograms": 0 }
  }
}`,
    errorExample: `// no matches is NOT an error - a 200 with empty arrays and zero totals

// 400 - invalid parameter (e.g. searchTerm of 1 character, unknown type value)
{ "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed.", "issues": [...] } }`,
  },
];

export { apiEndpoints };
