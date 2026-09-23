import request from "supertest";
import { app } from "../../src/app.js";
import { describe, test, expect } from "vitest";
import { prisma } from "../../src/db/prisma.js";

function getResponseObject(body: unknown): Record<string, unknown> {
  expect(body).toBeTypeOf("object");
  expect(body).not.toBeNull();

  return body as Record<string, unknown>;
}

function getResponseArray(value: unknown): Record<string, unknown>[] {
  expect(Array.isArray(value)).toBe(true);

  return value as Record<string, unknown>[];
}

describe("GET /", () => {
  test("responds with status 200 when LIVE", async () => {
    const response = await request(app).get("/api/v1/");
    const expectedResponse = {
      status: 200,
      body: {
        data: {
          status: "ok",
        },
        message: "API v1 server is running",
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});

describe("GET /api/v1/universities", () => {
  test("responds with status 200 and universities", async () => {
    const testUniversityName = "Test Integration University GET All";
    const existing = await prisma.university.findMany({
      where: { name: testUniversityName },
    });
    for (const u of existing) {
      await prisma.university.delete({ where: { id: u.id } });
    }

    const uniInDb = await prisma.university.create({
      data: {
        name: testUniversityName,
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });

    const response = await request(app).get("/api/v1/universities");
    const responseBody = getResponseObject(response.body);
    const data = getResponseArray(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe(
      "Universities retrieved successfully.",
    );
    expect(
      data.some(
        (university) =>
          university["name"] === uniInDb.name &&
          university["city"] === uniInDb.city,
      ),
    ).toBe(true);
    await prisma.university.delete({ where: { id: uniInDb.id } });
  });
});

describe("GET /api/v1/search", () => {
  // generous timeout: the whole suite shares one postgres and this file's
  // searches are the heaviest queries in it
  test(
    "responds with status 200 and universities matched by city",
    { timeout: 15000 },
    async () => {
      const testUniversityName = "Test Integration University Search";
      const existing = await prisma.university.findMany({
        where: { name: testUniversityName },
      });
      for (const u of existing) {
        await prisma.university.delete({ where: { id: u.id } });
      }

      const uniInDb = await prisma.university.create({
        data: {
          name: testUniversityName,
          city: "TestSearchCity",
          entity: "FBIH",
          ownership: "PUBLIC",
        },
      });

      const response = await request(app).get(
        "/api/v1/search?searchTerm=TestSearchCity",
      );
      const responseBody = getResponseObject(response.body);
      const data = getResponseObject(responseBody["data"]);
      const universities = getResponseArray(data["universities"]);

      expect(response.status).toBe(200);
      expect(responseBody["message"]).toBe(
        "Search results retrieved successfully.",
      );
      expect(
        universities.some(
          (university) =>
            university["name"] === uniInDb.name &&
            university["city"] === uniInDb.city,
        ),
      ).toBe(true);

      await prisma.university.delete({ where: { id: uniInDb.id } });
    },
  );

  test("responds with status 200 and empty groups when nothing matches", async () => {
    const response = await request(app).get(
      "/api/v1/search?searchTerm=completely-nonexistent-term-xyz",
    );
    const expectedResponse = {
      status: 200,
      body: {
        message: "Search results retrieved successfully.",
        data: {
          universities: [],
          faculties: [],
          studyPrograms: [],
          totals: {
            universities: 0,
            faculties: 0,
            studyPrograms: 0,
          },
          direct: {
            universities: 0,
            faculties: 0,
            studyPrograms: 0,
          },
        },
      },
    };

    expect(response).toEqual(expect.objectContaining(expectedResponse));
  });
});

describe("GET /api/v1/search - multi-word terms", () => {
  test("returns only entities matching every word across the hierarchy", async () => {
    const suffix = "MultiWordTest";
    const cleanup = async () => {
      await prisma.studyProgram.deleteMany({
        where: { name: { contains: suffix } },
      });
      await prisma.faculty.deleteMany({
        where: { name: { contains: suffix } },
      });
      await prisma.university.deleteMany({
        where: { name: { contains: suffix } },
      });
    };
    await cleanup();

    await prisma.university.create({
      data: {
        name: `Univerzitet ${suffix} Zvornik`,
        city: "TestZvornik",
        entity: "RS",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: `Fakultet ${suffix} Zvornik`,
            studyPrograms: {
              create: {
                name: `TestInformatika ${suffix} A`,
                cycle: "FIRST",
              },
            },
          },
        },
      },
    });
    await prisma.university.create({
      data: {
        name: `Univerzitet ${suffix} Trebinje`,
        city: "TestTrebinje",
        entity: "RS",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: `Fakultet ${suffix} Trebinje`,
            studyPrograms: {
              create: {
                name: `TestInformatika ${suffix} B`,
                cycle: "FIRST",
              },
            },
          },
        },
      },
    });

    const response = await request(app).get(
      "/api/v1/search?searchTerm=TestZvornik%20TestInformatika",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const universities = getResponseArray(data["universities"]);
    const studyPrograms = getResponseArray(data["studyPrograms"]);

    expect(response.status).toBe(200);
    // the Zvornik university matches "TestZvornik" (own city) and
    // "TestInformatika" (its program) - symmetric context matching
    expect(universities).toHaveLength(1);
    expect(universities[0]?.["name"]).toBe(`Univerzitet ${suffix} Zvornik`);
    // the program in TestTrebinje matches "TestInformatika" but not "TestZvornik"
    expect(studyPrograms).toHaveLength(1);
    expect(studyPrograms[0]?.["name"]).toBe(`TestInformatika ${suffix} A`);

    await cleanup();
  });

  test("matches enum aliases per word", async () => {
    const suffix = "AliasWordTest";
    const cleanup = async () => {
      await prisma.studyProgram.deleteMany({
        where: { name: { contains: suffix } },
      });
      await prisma.faculty.deleteMany({
        where: { name: { contains: suffix } },
      });
      await prisma.university.deleteMany({
        where: { name: { contains: suffix } },
      });
    };
    await cleanup();

    for (const [city, ownership] of [
      ["TestAliasGradA", "PUBLIC"],
      ["TestAliasGradB", "PRIVATE"],
    ] as const) {
      await prisma.university.create({
        data: {
          name: `Univerzitet ${suffix} ${city}`,
          city,
          entity: "FBIH",
          ownership,
          faculties: {
            create: {
              name: `Fakultet ${suffix} ${city}`,
              studyPrograms: {
                create: {
                  name: `TestPravo ${suffix} ${city}`,
                  cycle: "FIRST",
                },
              },
            },
          },
        },
      });
    }

    const response = await request(app).get(
      "/api/v1/search?searchTerm=javna%20TestPravo",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const studyPrograms = getResponseArray(data["studyPrograms"]);

    expect(response.status).toBe(200);
    expect(studyPrograms).toHaveLength(1);
    expect(studyPrograms[0]?.["name"]).toBe(
      `TestPravo ${suffix} TestAliasGradA`,
    );

    await cleanup();
  });
});

describe("GET /api/v1/search - context matching and numeric tokens", () => {
  test("finds a university and faculty through a program name", async () => {
    const marker = "DownwardTestProgram";
    const cleanup = async () => {
      await prisma.studyProgram.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.faculty.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.university.deleteMany({
        where: { name: { contains: marker } },
      });
    };
    await cleanup();

    const university = await prisma.university.create({
      data: {
        name: `Univerzitet ${marker} Host`,
        city: "TestGrad",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: `Fakultet ${marker} Host`,
            studyPrograms: {
              create: { name: `${marker}Unique`, cycle: "FIRST" },
            },
          },
        },
      },
    });

    const response = await request(app).get(
      `/api/v1/search?searchTerm=${marker}Unique`,
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);
    const universities = getResponseArray(data["universities"]);
    const faculties = getResponseArray(data["faculties"]);

    expect(response.status).toBe(200);
    expect(universities.some((u) => u["id"] === university.id)).toBe(true);
    expect(faculties.some((f) => f["name"] === `Fakultet ${marker} Host`)).toBe(
      true,
    );

    await cleanup();
  });

  test("matches ECTS and duration tokens on study programs", async () => {
    const marker = "TestEctsProgram";
    const cleanup = async () => {
      await prisma.studyProgram.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.faculty.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.university.deleteMany({
        where: { name: { contains: marker } },
      });
    };
    await cleanup();

    await prisma.university.create({
      data: {
        name: `Univerzitet ${marker}`,
        city: "TestGrad",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: `Fakultet ${marker}`,
            studyPrograms: {
              create: {
                name: `${marker} Glavni`,
                cycle: "FIRST",
                ects: 177,
                durationYears: 7,
              },
            },
          },
        },
      },
    });

    const hit = async (term: string) => {
      const response = await request(app).get(
        `/api/v1/search?searchTerm=${encodeURIComponent(term)}`,
      );
      const data = getResponseObject(getResponseObject(response.body)["data"]);
      return getResponseArray(data["studyPrograms"]);
    };

    expect(await hit(`${marker} 177 ects`)).toHaveLength(1);
    expect(await hit(`${marker} 7 godine`)).toHaveLength(1);
    expect(await hit(`${marker} 179 ects`)).toHaveLength(0);

    await cleanup();
  });

  test("caps federated sections at 25 with true totals; single type is uncapped", async () => {
    const marker = "CapTestUni";
    const cleanup = () =>
      prisma.university.deleteMany({ where: { name: { contains: marker } } });
    await cleanup();

    await prisma.university.createMany({
      data: Array.from({ length: 28 }, (_, i) => ({
        name: `${marker} ${String(i).padStart(2, "0")}`,
        city: "TestGrad",
        entity: "FBIH" as const,
        ownership: "PUBLIC" as const,
      })),
    });

    const federated = await request(app).get(
      `/api/v1/search?searchTerm=${marker}`,
    );
    const federatedData = getResponseObject(
      getResponseObject(federated.body)["data"],
    );
    expect(getResponseArray(federatedData["universities"])).toHaveLength(25);
    const totals = getResponseObject(federatedData["totals"]);
    expect(totals["universities"]).toBe(28);

    const singleType = await request(app).get(
      `/api/v1/search?searchTerm=${marker}&type=university`,
    );
    const singleTypeData = getResponseObject(
      getResponseObject(singleType.body)["data"],
    );
    expect(getResponseArray(singleTypeData["universities"])).toHaveLength(28);

    await cleanup();
  });

  test("own-field matches come before context-only matches", async () => {
    const marker = "TierMarker";
    const cleanup = async () => {
      await prisma.faculty.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.university.deleteMany({
        where: {
          OR: [
            { name: { contains: marker } },
            { name: { contains: "TierContextHost" } },
          ],
        },
      });
    };
    await cleanup();

    const ownMatch = await prisma.university.create({
      data: {
        name: `Zzz ${marker} Own Univerzitet`,
        city: "TestGrad",
        entity: "FBIH",
        ownership: "PUBLIC",
      },
    });
    const contextMatch = await prisma.university.create({
      data: {
        // sorts before the own match alphabetically, so plain ordering
        // would put it first - the tiering must not
        name: "Aaa TierContextHost Univerzitet",
        city: "TestGrad",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: { create: { name: `Fakultet ${marker} Context` } },
      },
    });

    const response = await request(app).get(
      `/api/v1/search?searchTerm=${marker}`,
    );
    const data = getResponseObject(getResponseObject(response.body)["data"]);
    const universities = getResponseArray(data["universities"]);

    expect(universities).toHaveLength(2);
    expect(universities[0]?.["id"]).toBe(ownMatch.id);
    expect(universities[1]?.["id"]).toBe(contextMatch.id);

    await cleanup();
  });
});

describe("GET /api/v1/search - empty browse", () => {
  test("returns capped sections with totals when no term or filters given", async () => {
    const response = await request(app).get("/api/v1/search");
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    for (const key of ["universities", "faculties", "studyPrograms"]) {
      expect(getResponseArray(data[key]).length).toBeLessThanOrEqual(25);
    }
    expect(data["totals"]).toBeDefined();
    expect(data["direct"]).toBeDefined();
  });
});

describe("GET /api/v1/search - inflected terms", () => {
  test("declined forms find base and derived names, and enum stems apply", async () => {
    const marker = "StemTestMed";
    const cleanup = async () => {
      await prisma.studyProgram.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.faculty.deleteMany({
        where: { name: { contains: marker } },
      });
      await prisma.university.deleteMany({
        where: { name: { contains: marker } },
      });
    };
    await cleanup();

    await prisma.university.create({
      data: {
        name: `Univerzitet ${marker}`,
        city: "TestGrad",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: `Medicinski fakultet ${marker}`,
            studyPrograms: {
              create: { name: `Medicina ${marker}`, cycle: "INTEGRATED" },
            },
          },
        },
      },
    });

    // each declined query form must find both the noun and the adjective name
    for (const form of ["medicina", "medicine", "medicini"]) {
      const response = await request(app).get(
        `/api/v1/search?searchTerm=${form}%20${marker}`,
      );
      const data = getResponseObject(getResponseObject(response.body)["data"]);
      const programs = getResponseArray(data["studyPrograms"]);
      const faculties = getResponseArray(data["faculties"]);

      expect(response.status).toBe(200);
      expect(
        programs.some((sp) => sp["name"] === `Medicina ${marker}`),
        `programs for "${form}"`,
      ).toBe(true);
      expect(
        faculties.some((f) => f["name"] === `Medicinski fakultet ${marker}`),
        `faculties for "${form}"`,
      ).toBe(true);
    }

    // gender/case forms of "javna" reach the ownership enum via the stem
    const enumResponse = await request(app).get(
      `/api/v1/search?searchTerm=javno%20${marker}&type=university`,
    );
    const enumData = getResponseObject(
      getResponseObject(enumResponse.body)["data"],
    );
    const universities = getResponseArray(enumData["universities"]);
    expect(
      universities.some((u) => u["name"] === `Univerzitet ${marker}`),
    ).toBe(true);

    await cleanup();
  });
});

describe("GET /api/v1/search - type filter", () => {
  test("returns only the requested entity types", async () => {
    const response = await request(app).get(
      "/api/v1/search?searchTerm=univerzitet&type=university&type=faculty",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(getResponseArray(data["studyPrograms"])).toHaveLength(0);
  });

  test("supports type-only browsing without a search term", async () => {
    const response = await request(app).get("/api/v1/search?type=university");
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(
      getResponseArray(data["universities"]).length,
    ).toBeGreaterThanOrEqual(0);
    expect(getResponseArray(data["faculties"])).toHaveLength(0);
    expect(getResponseArray(data["studyPrograms"])).toHaveLength(0);
  });
});

describe("GET /api/v1/universities/:id", () => {
  test("responds with status 200 and a university by id", async () => {
    const uniInDb = await prisma.university.create({
      data: {
        name: "Test Integration University By ID",
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: "Test Integration Faculty By ID",
            studyPrograms: {
              create: {
                name: "Test Integration Study Program By ID",
                cycle: "FIRST",
              },
            },
          },
        },
      },
    });

    const response = await request(app).get(
      `/api/v1/universities/${String(uniInDb.id)}`,
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    expect(response.status).toBe(200);
    expect(responseBody["message"]).toBe("University retrieved successfully.");
    expect(data["id"]).toBe(uniInDb.id);
    expect(data["name"]).toBe(uniInDb.name);
    const faculties = getResponseArray(data["faculties"]);
    const studyPrograms = getResponseArray(faculties[0]?.["studyPrograms"]);

    expect(faculties[0]?.["name"]).toBe("Test Integration Faculty By ID");
    expect(studyPrograms[0]?.["name"]).toBe(
      "Test Integration Study Program By ID",
    );

    await prisma.studyProgram.deleteMany({
      where: { faculty: { universityId: uniInDb.id } },
    });
    await prisma.faculty.deleteMany({ where: { universityId: uniInDb.id } });
    await prisma.university.delete({ where: { id: uniInDb.id } });
  });

  test("responds with status 400 for invalid university id", async () => {
    const response = await request(app).get(
      "/api/v1/universities/not-a-number",
    );
    const responseBody = getResponseObject(response.body);
    const error = getResponseObject(responseBody["error"]);

    expect(response.status).toBe(400);
    expect(error["message"]).toBeTypeOf("string");
    expect(error["message"]).toBe("Request validation failed.");
  });
});

describe("GET /api/v1/search - related entities", () => {
  test("responds with grouped faculties and study programs including parent data", async () => {
    const university = await prisma.university.create({
      data: {
        name: "Test Integration Unified Search University",
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: "Test Integration Unified Search Faculty",
            studyPrograms: {
              create: {
                name: "Test Integration Unified Search Program",
                cycle: "FIRST",
              },
            },
          },
        },
      },
    });

    const response = await request(app).get(
      "/api/v1/search?searchTerm=Test%20Integration%20Unified%20Search",
    );
    const responseBody = getResponseObject(response.body);
    const data = getResponseObject(responseBody["data"]);

    const universities = getResponseArray(data["universities"]);
    const faculties = getResponseArray(data["faculties"]);
    const studyPrograms = getResponseArray(data["studyPrograms"]);

    expect(response.status).toBe(200);
    expect(universities.some((u) => u["name"] === university.name)).toBe(true);

    const faculty = faculties.find(
      (f) => f["name"] === "Test Integration Unified Search Faculty",
    );
    const facultyUniversity = getResponseObject(faculty?.["university"]);
    expect(facultyUniversity["id"]).toBe(university.id);

    const program = studyPrograms.find(
      (sp) => sp["name"] === "Test Integration Unified Search Program",
    );
    expect(program?.["cycle"]).toBe("FIRST");
    const programFaculty = getResponseObject(program?.["faculty"]);
    const programUniversity = getResponseObject(programFaculty["university"]);
    expect(programUniversity["id"]).toBe(university.id);

    await prisma.studyProgram.deleteMany({
      where: { faculty: { universityId: university.id } },
    });
    await prisma.faculty.deleteMany({ where: { universityId: university.id } });
    await prisma.university.delete({ where: { id: university.id } });
  });
});

describe("GET /api/v1/search - diacritic-insensitive matching", () => {
  test("matches accented data from ASCII terms and vice versa", async () => {
    const testUniversityName = "Test Diacritics Univerzitet Ćuprija";
    const existing = await prisma.university.findMany({
      where: { name: testUniversityName },
    });
    for (const u of existing) {
      await prisma.track.deleteMany({
        where: { studyProgram: { faculty: { universityId: u.id } } },
      });
      await prisma.studyProgram.deleteMany({
        where: { faculty: { universityId: u.id } },
      });
      await prisma.faculty.deleteMany({ where: { universityId: u.id } });
      await prisma.university.delete({ where: { id: u.id } });
    }

    const university = await prisma.university.create({
      data: {
        name: testUniversityName,
        city: "Sarajevo",
        entity: "FBIH",
        ownership: "PUBLIC",
        faculties: {
          create: {
            name: "Test Diacritics Džemal",
            studyPrograms: {
              create: {
                name: "Test Diacritics Program",
                cycle: "FIRST",
                tracks: {
                  create: {
                    name: "Test Diacritics Racunari",
                  },
                },
              },
            },
          },
        },
      },
    });

    const universityResponse = await request(app).get(
      "/api/v1/search?searchTerm=cuprija",
    );
    const universityBody = getResponseObject(universityResponse.body);
    const universityData = getResponseObject(universityBody["data"]);
    const universities = getResponseArray(universityData["universities"]);

    expect(universityResponse.status).toBe(200);
    expect(universities.some((u) => u["name"] === testUniversityName)).toBe(
      true,
    );

    const facultyResponse = await request(app).get(
      "/api/v1/search?searchTerm=dzemal",
    );
    const facultyBody = getResponseObject(facultyResponse.body);
    const facultyData = getResponseObject(facultyBody["data"]);
    const faculties = getResponseArray(facultyData["faculties"]);

    expect(facultyResponse.status).toBe(200);
    expect(faculties.some((f) => f["name"] === "Test Diacritics Džemal")).toBe(
      true,
    );

    // track names are no longer a standalone section; the search surfaces
    // the parent study program through downward matching instead
    const trackResponse = await request(app).get(
      `/api/v1/search?searchTerm=${encodeURIComponent("računari")}`,
    );
    const trackBody = getResponseObject(trackResponse.body);
    const trackData = getResponseObject(trackBody["data"]);
    const programs = getResponseArray(trackData["studyPrograms"]);

    expect(trackResponse.status).toBe(200);
    const matchedProgram = programs.find(
      (sp) => sp["name"] === "Test Diacritics Program",
    );
    expect(matchedProgram).toBeDefined();
    const inlineTracks = getResponseArray(matchedProgram?.["tracks"]);
    expect(
      inlineTracks.some((tr) => tr["name"] === "Test Diacritics Racunari"),
    ).toBe(true);

    await prisma.track.deleteMany({
      where: {
        studyProgram: { faculty: { universityId: university.id } },
      },
    });
    await prisma.studyProgram.deleteMany({
      where: { faculty: { universityId: university.id } },
    });
    await prisma.faculty.deleteMany({ where: { universityId: university.id } });
    await prisma.university.delete({ where: { id: university.id } });
  });
});
