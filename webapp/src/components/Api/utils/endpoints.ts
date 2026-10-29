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

const paginationParams = [
  {
    name: "page",
    required: false,
    descriptionKey: "api.endpointsData.pageParam",
  },
  {
    name: "limit",
    required: false,
    descriptionKey: "api.endpointsData.limitParam",
  },
];

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
    params: paginationParams,
    successExample: `{
  "message": "Universities retrieved successfully.",
  "data": [
    {
      "id": 17,
      "name": "Univerzitet u Sarajevu",
      "acronym": "UNSA",
      "city": "Sarajevo",
      "country": "BIH",
      "entity": "FBIH",
      "ownership": "PUBLIC",
      "foundedYear": "1949",
      "website": "https://www.unsa.ba",
      "_count": { "faculties": 27 }
    },
    ...
  ],
  "page": 1,
  "totalPages": 1,
  "total": 53
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
    "id": 17,
    "name": "Univerzitet u Sarajevu",
    "acronym": "UNSA",
    "city": "Sarajevo",
    "country": "BIH",
    "entity": "FBIH",
    "ownership": "PUBLIC",
    "foundedYear": "1949",
    "website": "https://www.unsa.ba",
    "address": "Obala Kulina bana 7/II, 71000 Sarajevo",
    "phone": "+387 33 565 100", "email": "javnost@unsa.ba",
    "accreditationFrom": "2007-08-15T00:00:00.000Z",
    "accreditationTo": "2029-08-25T00:00:00.000Z",
    "authority": "Ministarstvo za nauku, visoko obrazovanje i mlade Kantona Sarajevo",
    "dataSourceUrl": "https://www.hea.gov.ba/Content/Read/lista-akreditiranih-vsu",
    "lastModified": "2026-08-29T00:00:00.000Z",
    "faculties": [
      { "id": 142, "name": "Filozofski fakultet", "city": "Sarajevo", ...,
        "studyPrograms": [
          { "id": 1309, "name": "Arapski jezik i književnost",
            "cycle": "FIRST", ..., "tracks": [ ... ]
          },
          ...
        ]
      },
      ...
    ]
  }
}`,
    errorExample: notFoundError("University"),
  },
  {
    method: "GET",
    path: "/api/v1/faculties",
    descriptionKey: "api.endpointsData.getAllFaculties",
    params: paginationParams,
    successExample: `{
  "message": "Faculties retrieved successfully.",
  "data": [
    {
      "id": 106, "name": "Elektrotehnički fakultet",
      "city": "Istočno Sarajevo", "website": "http://etf.ues.rs.ba",
      "university": { "id": 15, "name": "Univerzitet u Istočnom Sarajevu", "acronym": "UNIS" }
    },
    ...
  ],
  "page": 1, "totalPages": 4, "total": 193
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
    "id": 106, "name": "Elektrotehnički fakultet", "universityId": 15,
    "city": "Istočno Sarajevo", "website": "http://etf.ues.rs.ba",
    "address": "Vuka Karadžića 30, 71123 Istočno Sarajevo",
    "phone": "+387 57 342 788", "email": "kontakt@etf.ues.rs.ba",
    "isUniversityLevel": false,
    "dataSourceUrl": "https://www.ues.rs.ba/en/faculties/",
    "lastModified": "2026-08-29T00:00:00.000Z",
    "university": { "id": 15, "name": "Univerzitet u Istočnom Sarajevu",
      "acronym": "UNIS", ... },
    "studyPrograms": [
      { "id": 871, "name": "Automatika i elektronika", "cycle": "FIRST", ...,
        "tracks": [ ... ]
      },
      ...
    ]
  }
}`,
    errorExample: notFoundError("Faculty"),
  },
  {
    method: "GET",
    path: "/api/v1/study-programs",
    descriptionKey: "api.endpointsData.getAllStudyPrograms",
    params: paginationParams,
    successExample: `{
  "message": "Study programs retrieved successfully.",
  "data": [
    {
      "id": 1, "name": "Menadžment i preduzetništvo", "cycle": "FIRST",
      "durationYears": 3, "ects": 180, "language": null,
      "faculty": { "id": 2, "name": "Ekonomski fakultet",
        "university": { "id": 1, "name": "Evropski univerzitet, Brčko distrikt BiH" }
      }
    },
    ...
  ],
  "page": 1, "totalPages": 37, "total": 1823
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
    "id": 190, "name": "Ekonomija", "facultyId": 18, "cycle": "FIRST",
    "durationYears": 4, "ects": 240, "language": null,
    "dataSourceUrl": "http://iubd.edu.ba/index.php/fakulteti/fakultet-za-menadzmentt/ekonomija",
    "lastModified": "2026-08-25T00:00:00.000Z",
    "faculty": { "id": 18, "name": "Fakultet za menadžment", ...,
      "university": { "id": 2, "name": "Internacionalni univerzitet, Brčko distrikt BiH", ... }
    },
    "tracks": [
      { "id": 1, "name": "Računovodstvo i revizija", "studyProgramId": 190,
        "ects": null, "durationYears": null, "dataSourceUrl": null,
        "lastModified": "2026-08-26T00:00:00.000Z" },
      ...
    ]
  }
}`,
    errorExample: notFoundError("Study program"),
  },
  {
    method: "GET",
    path: "/api/v1/tracks",
    descriptionKey: "api.endpointsData.getAllTracks",
    params: paginationParams,
    successExample: `{
  "message": "Tracks retrieved successfully.",
  "data": [
    {
      "id": 1, "name": "Računovodstvo i revizija", "ects": null, "durationYears": null,
      "studyProgram": { "id": 190, "name": "Ekonomija",
        "faculty": { "id": 18, "name": "Fakultet za menadžment",
          "university": { "id": 2, "name": "Internacionalni univerzitet, Brčko distrikt BiH" }
        }
      }
    },
    ...
  ],
  "page": 1, "totalPages": 12, "total": 584
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
    "id": 1, "name": "Računovodstvo i revizija", "studyProgramId": 190,
    "ects": null, "durationYears": null, "dataSourceUrl": null,
    "lastModified": "2026-08-26T00:00:00.000Z",
    "studyProgram": { "id": 190, "name": "Ekonomija", "cycle": "FIRST", ...,
      "faculty": { "id": 18, "name": "Fakultet za menadžment", ...,
        "university": { "id": 2, "name": "Internacionalni univerzitet, Brčko distrikt BiH", ... }
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
        name: "country",
        required: false,
        descriptionKey: "api.endpointsData.countryParam",
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
    "direct": { "universities": 4, "faculties": 20, "studyPrograms": 0 }
  }
}`,
    errorExample: `// no matches is NOT an error - a 200 with empty arrays

// 400 - invalid parameter (e.g. searchTerm of 1 character, unknown type value)
{ "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed.", "issues": [...] } }`,
  },
];

export { apiEndpoints };
