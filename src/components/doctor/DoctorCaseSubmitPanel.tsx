import { useMemo, useRef, useState, type FormEvent } from "react";
import { useLocaleContext } from "../../i18n/useLocaleContext";
import { useTests } from "../../hooks/useTests";
import { Button } from "../ui/Button";
import { OtherTextDialog } from "../ui/OtherTextDialog";
import { isPatientNameComplete } from "../../lib/patientName";
import {
  insertDoctorCase,
  buildRequestFormImageContext,
  isAllowedDoctorCaseFile,
  isCustomOtherTestSlug,
  newCustomOtherTestSlug,
  type DoctorAgeUnit,
  type DoctorDiseaseType,
  type DoctorGender,
} from "../../lib/doctorCasesStore";
import { TestCheckboxPicker } from "../shared/TestCheckboxPicker";
import { testDisplayTitle } from "../../lib/testCatalog";
import type { Messages } from "../../i18n/messages";
import type { TestRow } from "../../types/database";

type Props = {
  m: Messages["doctorPortal"];
};

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20";

function catalogTestTitle(slug: string, catalog: TestRow[], locale: string): string {
  const t = catalog.find((x) => x.slug === slug);
  if (!t) return slug;
  return testDisplayTitle(t, locale);
}

export function DoctorCaseSubmitPanel({ m }: Props) {
  const { locale } = useLocaleContext();
  const { tests, loading: loadingTests } = useTests();
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [name3, setName3] = useState("");
  const [name4, setName4] = useState("");
  const [ageValue, setAgeValue] = useState("");
  const [ageUnit, setAgeUnit] = useState<DoctorAgeUnit>("years");
  const [gender, setGender] = useState<DoctorGender>("male");
  const [diagnosis, setDiagnosis] = useState("");
  const [diseaseType, setDiseaseType] = useState<DoctorDiseaseType>("oncology");
  const [diseaseTypeOther, setDiseaseTypeOther] = useState("");
  const [diseaseOtherDialogOpen, setDiseaseOtherDialogOpen] = useState(false);
  const [tumorType, setTumorType] = useState("");
  const [stage, setStage] = useState("");
  const [treatment, setTreatment] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [otherTestTitles, setOtherTestTitles] = useState<Map<string, string>>(
    new Map(),
  );
  const [testOtherDialogOpen, setTestOtherDialogOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const filesRef = useRef<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testPickerKey, setTestPickerKey] = useState(0);

  const testPickerLabels = useMemo(
    () => ({
      legend: m.testSelect,
      hint: m.testSelectHint,
      loading: m.loadingTests,
      empty: m.testPlaceholder,
      searchPlaceholder: m.testSearchPlaceholder,
      searchNoResults: m.testSearchNoResults,
      otherOption: m.testOtherOption,
    }),
    [m],
  );

  function diseaseTypeLabel(type: DoctorDiseaseType): string {
    if (type === "oncology") return m.diseaseOncology;
    if (type === "reproductive") return m.diseaseReproductive;
    if (type === "pediatric") return m.diseasePediatric;
    return diseaseTypeOther.trim() || m.diseaseOther;
  }

  function toggleTest(slug: string) {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        if (isCustomOtherTestSlug(slug)) {
          setOtherTestTitles((map) => {
            const copy = new Map(map);
            copy.delete(slug);
            return copy;
          });
        }
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  function addOtherTest(title: string) {
    const slug = newCustomOtherTestSlug();
    setOtherTestTitles((map) => new Map(map).set(slug, title));
    setSelectedTests((prev) => new Set(prev).add(slug));
  }

  function syncFiles(next: File[]) {
    filesRef.current = next;
    setFiles(next);
  }

  function addFilesFromList(list: FileList | null) {
    if (!list?.length) return;
    const rejected: string[] = [];
    const accepted: File[] = [];
    for (const file of Array.from(list)) {
      if (isAllowedDoctorCaseFile(file)) accepted.push(file);
      else rejected.push(file.name);
    }
    if (rejected.length > 0) {
      setMsg({
        ok: false,
        text:
          m.fileTypeErr + (rejected.length ? ` (${rejected.join(", ")})` : ""),
      });
    } else {
      setMsg(null);
    }
    if (accepted.length === 0) return;
    syncFiles([...filesRef.current, ...accepted]);
  }

  function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFilesFromList(e.target.files);
    e.target.value = "";
  }

  function removeFile(index: number) {
    syncFiles(filesRef.current.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const parts = [name1, name2, name3, name4] as const;
    if (!isPatientNameComplete(parts)) {
      setMsg({ ok: false, text: m.patientNameRequired });
      return;
    }

    const age = Number.parseInt(ageValue, 10);
    if (!Number.isFinite(age) || age <= 0) {
      setMsg({ ok: false, text: m.ageInvalid });
      return;
    }

    if (!diagnosis.trim()) {
      setMsg({ ok: false, text: m.diagnosisRequired });
      return;
    }

    if (diseaseType === "oncology") {
      if (!tumorType.trim() || !stage.trim() || !treatment.trim()) {
        setMsg({ ok: false, text: m.oncologyFieldsRequired });
        return;
      }
    }

    if (diseaseType === "other" && !diseaseTypeOther.trim()) {
      setMsg({ ok: false, text: m.diseaseOtherRequired });
      return;
    }

    if (selectedTests.size === 0) {
      setMsg({ ok: false, text: m.selectAtLeastOneTest });
      return;
    }

    const uploadFiles = filesRef.current;
    const otherTitlesRecord = Object.fromEntries(otherTestTitles.entries());

    setBusy(true);
    const testTitles = [...selectedTests].map((slug) => {
      if (isCustomOtherTestSlug(slug)) {
        return otherTestTitles.get(slug) ?? slug;
      }
      return catalogTestTitle(slug, tests, locale);
    });
    const diseaseLabel = diseaseTypeLabel(diseaseType);
    const oncologyDetails =
      diseaseType === "oncology"
        ? [
            m.oncologyTumorType,
            tumorType,
            m.oncologyStage,
            stage,
            m.oncologyTreatment,
            treatment,
          ]
            .filter(Boolean)
            .join(" ")
        : undefined;
    const res = await insertDoctorCase({
      patientName: parts,
      age_value: age,
      age_unit: ageUnit,
      gender,
      diagnosis,
      disease_type: diseaseType,
      disease_type_other: diseaseType === "other" ? diseaseTypeOther : null,
      oncology_tumor_type: diseaseType === "oncology" ? tumorType : undefined,
      oncology_stage: diseaseType === "oncology" ? stage : undefined,
      oncology_treatment: diseaseType === "oncology" ? treatment : undefined,
      test_slugs: [...selectedTests],
      other_test_titles: otherTitlesRecord,
      files: uploadFiles,
      requestFormContext: buildRequestFormImageContext(
        locale,
        { days: m.ageUnitDays, months: m.ageUnitMonths, years: m.ageUnitYears },
        testTitles,
        { diseaseTypeLabel: diseaseLabel, oncologyDetails },
      ),
    });
    setBusy(false);

    if (!res.ok) {
      const errMap: Record<string, string> = {
        invalid_file_type: m.fileTypeErr,
        file_too_large: m.fileSizeErr,
        not_signed_in: m.notDoctor,
        no_tests: m.selectAtLeastOneTest,
      };
      setMsg({ ok: false, text: errMap[res.error ?? ""] ?? m.submitErr });
      return;
    }

    setMsg({
      ok: true,
      text:
        (res.count ?? selectedTests.size) > 1
          ? m.submitOkBatch.replace(
              "{n}",
              String(res.count ?? selectedTests.size),
            )
          : m.submitOk,
    });
    setName1("");
    setName2("");
    setName3("");
    setName4("");
    setAgeValue("");
    setDiagnosis("");
    setDiseaseType("oncology");
    setDiseaseTypeOther("");
    setTumorType("");
    setStage("");
    setTreatment("");
    setSelectedTests(new Set());
    setOtherTestTitles(new Map());
    setTestPickerKey((k) => k + 1);
    syncFiles([]);
  }

  return (
    <>
      <form
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={(e) => void onSubmit(e)}
      >
        <h2 className="text-lg font-bold text-urgen-navy">{m.caseFormTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{m.caseFormHint}</p>

        <fieldset className="mt-6 space-y-3">
          <legend className="text-sm font-semibold text-urgen-navy">
            {m.patientName}
          </legend>
          <p className="text-xs text-slate-500">{m.patientNameHint}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [m.patientNamePart1, name1, setName1],
                [m.patientNamePart2, name2, setName2],
                [m.patientNamePart3, name3, setName3],
                [m.patientNamePart4, name4, setName4],
              ] as const
            ).map(([label, val, set]) => (
              <label
                key={label}
                className="block text-sm font-medium text-slate-700"
              >
                {label}
                <input
                  type="text"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className={inputClass}
                  required
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.ageValue}
            <input
              type="number"
              min={1}
              value={ageValue}
              onChange={(e) => setAgeValue(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.ageUnit}
            <select
              value={ageUnit}
              onChange={(e) => setAgeUnit(e.target.value as DoctorAgeUnit)}
              className={inputClass}
            >
              <option value="years">{m.ageUnitYears}</option>
              <option value="months">{m.ageUnitMonths}</option>
              <option value="days">{m.ageUnitDays}</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-urgen-navy">
            {m.gender}
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as DoctorGender)}
              className={inputClass}
            >
              <option value="male">{m.genderMale}</option>
              <option value="female">{m.genderFemale}</option>
              <option value="other">{m.genderOther}</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-sm font-semibold text-urgen-navy">
          {m.diagnosis}
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={4}
            className={inputClass}
            required
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold text-urgen-navy">
            {m.diseaseType}
          </legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {(
              [
                ["oncology", m.diseaseOncology],
                ["reproductive", m.diseaseReproductive],
                ["pediatric", m.diseasePediatric],
                ["other", m.diseaseOther],
              ] as const
            ).map(([val, label]) => (
              <label
                key={val}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="diseaseType"
                  value={val}
                  checked={diseaseType === val}
                  onChange={() => {
                    if (val === "other") {
                      setDiseaseOtherDialogOpen(true);
                    } else {
                      setDiseaseType(val);
                      setDiseaseTypeOther("");
                    }
                  }}
                />
                {val === "other" && diseaseType === "other" && diseaseTypeOther
                  ? `${label}: ${diseaseTypeOther}`
                  : label}
              </label>
            ))}
          </div>
        </fieldset>

        {diseaseType === "oncology" && (
          <div className="mt-4 grid gap-4 rounded-xl border border-urgen-purple/20 bg-urgen-purple/5 p-4 sm:grid-cols-3">
            <label className="block text-sm font-semibold text-urgen-navy">
              {m.oncologyTumorType}
              <input
                type="text"
                value={tumorType}
                onChange={(e) => setTumorType(e.target.value)}
                className={inputClass}
                required
              />
            </label>
            <label className="block text-sm font-semibold text-urgen-navy">
              {m.oncologyStage}
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className={inputClass}
                required
              />
            </label>
            <label className="block text-sm font-semibold text-urgen-navy">
              {m.oncologyTreatment}
              <input
                type="text"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className={inputClass}
                required
              />
            </label>
          </div>
        )}

        <TestCheckboxPicker
          key={testPickerKey}
          className="mt-6"
          tests={tests}
          loading={loadingTests}
          selectedTests={selectedTests}
          onToggle={toggleTest}
          locale={locale}
          labels={testPickerLabels}
          otherTests={otherTestTitles}
          onRequestAddOther={() => setTestOtherDialogOpen(true)}
        />

        <div className="mt-6">
          <p className="text-sm font-semibold text-urgen-navy">
            {m.attachFiles}
          </p>
          <p className="mt-1 text-xs text-slate-500">{m.attachFilesHint}</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={onFilesChange}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {m.attachFilesPick}
            </Button>
            {files.length > 0 && (
              <span className="text-sm font-medium text-emerald-800">
                {m.filesSelected.replace("{n}", String(files.length))}
              </span>
            )}
          </div>
          {files.length > 0 && (
            <ul className="mt-3 space-y-1">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => removeFile(i)}
                  >
                    {m.removeFile}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {msg && (
          <p
            className={`mt-4 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}
          >
            {msg.text}
          </p>
        )}

        <Button type="submit" className="mt-6" disabled={busy}>
          {busy ? m.submitting : m.submitCase}
        </Button>
      </form>

      <OtherTextDialog
        open={diseaseOtherDialogOpen}
        title={m.diseaseOtherDialogTitle}
        placeholder={m.diseaseOtherPlaceholder}
        confirmLabel={m.otherDone}
        cancelLabel={m.cancelEdit}
        initialValue={diseaseTypeOther}
        onConfirm={(text) => {
          setDiseaseType("other");
          setDiseaseTypeOther(text);
        }}
        onClose={() => setDiseaseOtherDialogOpen(false)}
      />

      <OtherTextDialog
        open={testOtherDialogOpen}
        title={m.testOtherDialogTitle}
        placeholder={m.testOtherPlaceholder}
        confirmLabel={m.otherDone}
        cancelLabel={m.cancelEdit}
        onConfirm={addOtherTest}
        onClose={() => setTestOtherDialogOpen(false)}
      />
    </>
  );
}
