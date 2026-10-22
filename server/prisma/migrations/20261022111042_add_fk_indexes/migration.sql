-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "faculty_universityId_idx" ON "faculty"("universityId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "study_program_facultyId_idx" ON "study_program"("facultyId");

-- CreateIndex
CREATE INDEX "track_studyProgramId_idx" ON "track"("studyProgramId");
