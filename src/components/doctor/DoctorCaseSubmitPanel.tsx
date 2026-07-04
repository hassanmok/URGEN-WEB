import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLocaleContext } from "../../i18n/useLocaleContext";
import { useTests } from "../../hooks/useTests";
import { Button } from "../ui/Button";
import { isPatientNameComplete } from "../../lib/patientName";
import {
  createDoctorCaseFileDownloadUrl,
  createDoctorResultPdfDownloadUrl,
  fetchDoctorCaseFiles,
  fetchDoctorCaseTestsForCaseIds,
  fetchDoctorCases,
  groupDoctorCaseTestsByCaseId,
  attachDoctorRequestFormImage,
  insertDoctorCase,
  buildRequestFormImageContext,
  isAllowedDoctorCaseFile,
  isDoctorResultPdfExpired,
  normalizeDoctorCaseStatus,
  splitDoctorCaseFiles,
  type DoctorAgeUnit,
  type DoctorCaseFileRow,
  type DoctorCaseRow,
  type DoctorCaseTestRow,
  type DoctorDiseaseType,
  type DoctorGender,
} from "../../lib/doctorCasesStore";
import { TestCheckboxPicker } from "../shared/TestCheckboxPicker";
import { testDisplayTitle } from "../../lib/testCatalog";
import { DoctorCaseEditForm } from "./DoctorCaseEditForm";
import type { Messages } from "../../i18n/messages";
import type { TestRow } from "../../types/database";

type Props = {
  m: Messages["doctorPortal"];
};

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20";

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
  const [tumorType, setTumorType] = useState("");
  const [stage, setStage] = useState("");
  const [treatment, setTreatment] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<File[]>([]);
  const filesRef = useRef<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [cases, setCases] = useState<DoctorCaseRow[]>([]);
  const [testsByCase, setTestsByCase] = useState<
    Map<string, DoctorCaseTestRow[]>
  >(new Map());
  const [loadingCases, setLoadingCases] = useState(true);
  const [testPickerKey, setTestPickerKey] = useState(0);

  const testPickerLabels = useMemo(
    () => ({
      legend: m.testSelect,
      hint: m.testSelectHint,
      loading: m.loadingTests,
      empty: m.testPlaceholder,
      searchPlaceholder: m.testSearchPlaceholder,
      searchNoResults: m.testSearchNoResults,
    }),
    [m],
  );

  function toggleTest(slug: string) {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function loadCases() {
    setLoadingCases(true);
    const res = await fetchDoctorCases();
    if (res.ok && res.rows) {
      setCases(res.rows);
      const testRes = await fetchDoctorCaseTestsForCaseIds(
        res.rows.map((r) => r.id),
      );
      if (testRes.ok && testRes.rows) {
        setTestsByCase(groupDoctorCaseTestsByCaseId(testRes.rows));
      } else {
        setTestsByCase(new Map());
      }
    }
    setLoadingCases(false);
  }

  useEffect(() => {
    void loadCases();
  }, []);

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

    if (selectedTests.size === 0) {
      setMsg({ ok: false, text: m.selectAtLeastOneTest });
      return;
    }

    const uploadFiles = filesRef.current;

    setBusy(true);
    const testTitles = [...selectedTests].map((slug) =>
      testTitleFor(slug, tests, locale),
    );
    const diseaseLabel =
      diseaseType === "oncology"
        ? m.diseaseOncology
        : diseaseType === "reproductive"
          ? m.diseaseReproductive
          : m.diseasePediatric;
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
      oncology_tumor_type: diseaseType === "oncology" ? tumorType : undefined,
      oncology_stage: diseaseType === "oncology" ? stage : undefined,
      oncology_treatment: diseaseType === "oncology" ? treatment : undefined,
      test_slugs: [...selectedTests],
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
    setTumorType("");
    setStage("");
    setTreatment("");
    setSelectedTests(new Set());
    setTestPickerKey((k) => k + 1);
    syncFiles([]);
    void loadCases();
  }

  return (
    <div className="space-y-10">
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
                  onChange={() => setDiseaseType(val)}
                />
                {label}
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

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-urgen-navy">
            {m.myCasesTitle}
          </h2>
          <button
            type="button"
            className="text-sm font-semibold text-urgen-purple"
            onClick={() => void loadCases()}
          >
            {m.refresh}
          </button>
        </div>
        {loadingCases ? (
          <p className="mt-4 text-sm text-slate-500">{m.casesLoading}</p>
        ) : cases.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{m.casesEmpty}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {cases.map((c) => (
              <CaseCard
                key={c.id}
                row={c}
                m={m}
                locale={locale}
                caseTests={testsByCase.get(c.id) ?? []}
                catalogTests={tests}
                onUpdated={() => void loadCases()}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const caseStatusClass: Record<string, string> = {
  sent: "bg-blue-100 text-blue-900 ring-blue-300/80",
  pending: "bg-amber-100 text-amber-900 ring-amber-300/80",
  in_progress: "bg-sky-100 text-sky-900 ring-sky-300/80",
  rejected: "bg-red-100 text-red-900 ring-red-300/80",
  done: "bg-emerald-100 text-emerald-900 ring-emerald-300/80",
};

function testTitleFor(
  slug: string,
  catalog: TestRow[],
  locale: string,
): string {
  const t = catalog.find((x) => x.slug === slug);
  if (!t) return slug;
  return testDisplayTitle(t, locale);
}

function CaseCard({
  row,
  m,
  locale,
  caseTests,
  catalogTests,
  onUpdated,
}: {
  row: DoctorCaseRow;
  m: Messages["doctorPortal"];
  locale: string;
  caseTests: DoctorCaseTestRow[];
  catalogTests: TestRow[];
  onUpdated: () => void;
}) {
  const [files, setFiles] = useState<DoctorCaseFileRow[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [resultPdfBusy, setResultPdfBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const status = normalizeDoctorCaseStatus(row.status);
  const canEdit = status === "sent";
  const resultExpired = isDoctorResultPdfExpired(row);
  const resultPdfReady =
    status === "done" && row.pdf_storage_path && !resultExpired;

  function statusLabel(s: ReturnType<typeof normalizeDoctorCaseStatus>) {
    switch (s) {
      case "sent":
        return m.caseStatusSent;
      case "pending":
        return m.caseStatusPending;
      case "in_progress":
        return m.caseStatusInProgress;
      case "rejected":
        return m.caseStatusRejected;
      case "done":
        return m.caseStatusDone;
      default:
        return s;
    }
  }

  async function downloadResultPdf(storagePath: string) {
    setResultPdfBusy(true);
    const res = await createDoctorResultPdfDownloadUrl(storagePath);
    setResultPdfBusy(false);
    if (res.ok && res.url) window.open(res.url, "_blank", "noopener,noreferrer");
  }

  async function reloadFiles() {
    const res = await fetchDoctorCaseFiles(row.id);
    if (res.ok && res.rows) setFiles(res.rows);
    return res;
  }

  async function ensureRequestFormPdf() {
    const testTitles = caseTests.map((t) =>
      testTitleFor(t.test_slug, catalogTests, locale),
    );
    if (testTitles.length === 0) return;
    setPdfBusy(true);
    const diseaseLabel =
      row.disease_type === "oncology"
        ? m.diseaseOncology
        : row.disease_type === "reproductive"
          ? m.diseaseReproductive
          : m.diseasePediatric;
    const imgRes = await attachDoctorRequestFormImage(
      row.id,
      row.doctor_user_id,
      row,
      buildRequestFormImageContext(
        locale,
        { days: m.ageUnitDays, months: m.ageUnitMonths, years: m.ageUnitYears },
        testTitles,
        { diseaseTypeLabel: diseaseLabel },
      ),
    );
    if (imgRes.ok) {
      await reloadFiles();
    } else {
      console.error("[request_form_image]", imgRes.error);
    }
    setPdfBusy(false);
  }

  useEffect(() => {
    if (!expanded) return;
    let cancelled = false;
    void (async () => {
      setFilesLoading(true);
      const res = await reloadFiles();
      if (cancelled) return;
      setFilesLoading(false);
      if (!res.ok || !res.rows) return;
      const { requestForm: form } = splitDoctorCaseFiles(res.rows);
      if (!form) await ensureRequestFormPdf();
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, row.id, row.updated_at]);

  const { requestForm, attachments } = splitDoctorCaseFiles(files);

  const diseaseLabel =
    row.disease_type === "oncology"
      ? m.diseaseOncology
      : row.disease_type === "reproductive"
        ? m.diseaseReproductive
        : m.diseasePediatric;

  const genderLabel =
    row.gender === "male"
      ? m.genderMale
      : row.gender === "female"
        ? m.genderFemale
        : m.genderOther;

  const submittedAt = row.created_at
    ? new Date(row.created_at).toLocaleString(
        locale === "ar" ? "ar-IQ" : "en-US",
        {
          dateStyle: "medium",
          timeStyle: "short",
        },
      )
    : "—";

  if (editing && canEdit) {
    return (
      <li>
        <DoctorCaseEditForm
          row={row}
          caseTests={caseTests}
          m={m}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onUpdated();
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        className="w-full text-start"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-bold text-urgen-navy">{row.patient_full_name}</p>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${caseStatusClass[status] ?? "bg-slate-100 text-slate-800"}`}
          >
            {statusLabel(status)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {diseaseLabel} · {genderLabel}
        </p>
        {caseTests.length > 0 && (
          <p className="mt-1 text-xs text-slate-600">
            {m.testsInRequest}:{" "}
            {caseTests
              .map((t) => testTitleFor(t.test_slug, catalogTests, locale))
              .join(" · ")}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          {m.caseDateSubmitted}:{" "}
          <span dir="ltr" className="tabular-nums">
            {submittedAt}
          </span>
        </p>
      </button>
      {status === "rejected" && row.rejection_reason && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">{m.rejectionReason}: </span>
          {row.rejection_reason}
        </p>
      )}
      {status === "sent" && (
        <p className="mt-3 text-xs text-slate-500">{m.resultPdfAwaitAcceptance}</p>
      )}
      {!resultPdfReady &&
        status !== "done" &&
        status !== "sent" &&
        status !== "rejected" && (
          <p className="mt-3 text-xs text-slate-500">{m.resultPdfLocked}</p>
        )}
      {status === "done" && row.pdf_storage_path && row.pdf_expires_at && (
        <p
          className={`mt-3 text-xs font-medium ${
            resultExpired ? "text-amber-900" : "text-emerald-800"
          }`}
        >
          {resultExpired ? m.resultPdfExpiredAt : m.resultPdfValidUntil}
          {": "}
          <span dir="ltr" className="inline-block font-normal tabular-nums">
            {new Date(row.pdf_expires_at).toLocaleString(
              locale === "ar" ? "ar-IQ" : "en-US",
            )}
          </span>
        </p>
      )}
      {status === "done" && resultExpired && (
        <p className="mt-2 text-xs text-slate-600">{m.resultPdfExpired}</p>
      )}
      {resultPdfReady && (
        <div className="mt-3">
          <Button
            type="button"
            className="text-sm"
            disabled={resultPdfBusy}
            onClick={() => void downloadResultPdf(row.pdf_storage_path!)}
          >
            {resultPdfBusy ? "…" : m.resultPdfDownload}
          </Button>
        </div>
      )}
      {canEdit && (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            className="text-sm"
            onClick={() => setEditing(true)}
          >
            {m.editCase}
          </Button>
        </div>
      )}
      {expanded && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <p>
            <span className="font-semibold">{m.diagnosis}: </span>
            {row.diagnosis}
          </p>
          {row.disease_type === "oncology" && (
            <>
              <p>
                <span className="font-semibold">{m.oncologyTumorType}: </span>
                {row.oncology_tumor_type}
              </p>
              <p>
                <span className="font-semibold">{m.oncologyStage}: </span>
                {row.oncology_stage}
              </p>
              <p>
                <span className="font-semibold">{m.oncologyTreatment}: </span>
                {row.oncology_treatment}
              </p>
            </>
          )}
          <div className="mt-3 rounded-lg border border-urgen-purple/25 bg-urgen-purple/5 px-3 py-2">
            <p className="text-xs font-semibold text-urgen-navy">
              {m.requestFormPdf}
            </p>
            {filesLoading || pdfBusy ? (
              <p className="mt-1 text-xs text-slate-500">
                {m.requestFormPdfGenerating}
              </p>
            ) : requestForm ? (
              <button
                type="button"
                className="mt-1 text-sm font-semibold text-urgen-purple"
                onClick={() => void downloadFile(requestForm)}
              >
                {m.requestFormPdfDownload}
              </button>
            ) : (
              <button
                type="button"
                className="mt-1 text-sm font-semibold text-urgen-purple"
                onClick={() => void ensureRequestFormPdf()}
              >
                {m.requestFormPdfRetry}
              </button>
            )}
          </div>
          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {attachments.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="text-sm font-semibold text-urgen-purple"
                    onClick={() => void downloadFile(f)}
                  >
                    {f.file_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

async function downloadFile(file: DoctorCaseFileRow) {
  const res = await createDoctorCaseFileDownloadUrl(file.storage_path);
  if (res.ok && res.url) window.open(res.url, "_blank", "noopener,noreferrer");
}
