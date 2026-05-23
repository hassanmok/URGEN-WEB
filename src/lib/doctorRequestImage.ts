import templateUrl from "../assets/images/request-general.png?url";
import fontBoldUrl from "../assets/fonts/NotoSansArabic-Bold.ttf?url";
import type { DoctorGender } from "./doctorCasesStore";

export type DoctorRequestImageInput = {
  patientFullName: string;
  ageText: string;
  gender: DoctorGender;
  physicianName: string;
  diagnosis: string;
  testTitles: string[];
  requestDate: string;
};

let fontReady: Promise<void> | null = null;

function ensureFont(): Promise<void> {
  if (!fontReady) {
    fontReady = (async () => {
      const face = new FontFace("NotoSansArabicBold", `url(${fontBoldUrl})`, {
        weight: "700",
        style: "normal",
      });

      await face.load();
      document.fonts.add(face);
      await document.fonts.ready;
    })();
  }

  return fontReady;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("template_load_failed"));
    img.src = url;
  });
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const lines: string[] = [];

  for (const paragraph of normalized.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) continue;

    let current = words[0] ?? "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i]!;
      const trial = `${current} ${word}`;

      if (ctx.measureText(trial).width <= maxWidth) {
        current = trial;
      } else {
        lines.push(current);
        current = word;
      }
    }

    lines.push(current);
  }

  return lines;
}

/**
 * Base template size used to calibrate the coordinates.
 * The drawing will scale automatically to the actual image size.
 */
const BASE = {
  w: 1434,
  h: 2023,
} as const;

type Box = Readonly<{
  x: number;
  y: number;
  w: number;
  h: number;
  maxLines?: number;
}>;

const LAYOUT = {
  patientName: {
    x: 90,
    y: 313,
    w: 825,
    h: 49,
  },

  age: {
    x: 951,
    y: 313,
    w: 214,
    h: 49,
  },

  genderM: {
    x: 1203,
    y: 313,
    w: 51,
    h: 49,
  },

  genderF: {
    x: 1291,
    y: 313,
    w: 51,
    h: 49,
  },

  physician: {
    x: 90,
    y: 397,
    w: 825,
    h: 49,
  },

  date: {
    x: 951,
    y: 397,
    w: 391,
    h: 49,
  },

  diagnosis: {
    x: 90,
    y: 496,
    w: 1252,
    h: 389,
    maxLines: 7,
  },

  tests: {
    x: 90,
    y: 949,
    w: 1252,
    h: 721,
    maxLines: 15,
  },
} as const;

export async function generateDoctorRequestImage(
  input: DoctorRequestImageInput,
): Promise<Blob> {
  await ensureFont();

  const img = await loadImage(templateUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");

  const c = ctx;
  c.drawImage(img, 0, 0);

  const W = canvas.width;
  const H = canvas.height;

  const fontFamily = "NotoSansArabicBold, Arial, sans-serif";
  const ink = "#1a1a2e";

  const nameSize = Math.max(13, Math.round(W * 0.022));
  const fieldSize = Math.max(11, Math.round(W * 0.019));

  function sx(value: number): number {
    return (value / BASE.w) * W;
  }

  function sy(value: number): number {
    return (value / BASE.h) * H;
  }

  function setBoldFont(size: number) {
    c.font = `700 ${size}px ${fontFamily}`;
  }

  function drawSingleLineText(
    text: string,
    box: Box,
    size: number,
    options: {
      rtl?: boolean;
    } = {},
  ) {
    if (!text?.trim()) return;

    const x = sx(box.x);
    const y = sy(box.y);
    const w = sx(box.w);
    const h = sy(box.h);

    const padX = Math.max(10, W * 0.014);
    const padTop = Math.max(3, H * 0.003);
    const padBottom = Math.max(3, H * 0.003);

    const rtl = options.rtl ?? hasArabic(text);

    c.save();

    setBoldFont(size);
    c.fillStyle = ink;
    c.direction = rtl ? "rtl" : "ltr";
    c.textAlign = rtl ? "right" : "left";
    c.textBaseline = "alphabetic";

    // Clip area with small safe padding to avoid cutting glyph tops
    c.beginPath();
    c.rect(x + 2, y + 2, w - 4, h - 4);
    c.clip();

    const metrics = c.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent || size * 0.8;
    const descent = metrics.actualBoundingBoxDescent || size * 0.2;
    const textHeight = ascent + descent;

    const availableHeight = h - padTop - padBottom;
    const baselineY =
      y +
      padTop +
      Math.max(ascent, (availableHeight - textHeight) / 2 + ascent);

    const tx = rtl ? x + w - padX : x + padX;
    const maxWidth = w - padX * 2;

    c.fillText(text, tx, baselineY, maxWidth);

    c.restore();
  }

  function drawMultiLineText(
    text: string,
    box: Box,
    size: number,
    options: {
      rtl?: boolean;
      maxLines?: number;
    } = {},
  ) {
    if (!text?.trim()) return;

    const x = sx(box.x);
    const y = sy(box.y);
    const w = sx(box.w);
    const h = sy(box.h);

    const padX = Math.max(10, W * 0.014);
    const padTop = Math.max(10, H * 0.01);
    const padBottom = Math.max(8, H * 0.008);

    const rtl = options.rtl ?? hasArabic(text);
    const maxLines = options.maxLines ?? box.maxLines ?? 1;

    c.save();

    setBoldFont(size);
    c.fillStyle = ink;
    c.direction = rtl ? "rtl" : "ltr";
    c.textAlign = rtl ? "right" : "left";
    c.textBaseline = "alphabetic";

    c.beginPath();
    c.rect(x + 2, y + 2, w - 4, h - 4);
    c.clip();

    const tx = rtl ? x + w - padX : x + padX;
    const availableWidth = w - padX * 2;

    const sampleMetrics = c.measureText("Ag");
    const ascent = sampleMetrics.actualBoundingBoxAscent || size * 0.8;
    const descent = sampleMetrics.actualBoundingBoxDescent || size * 0.2;
    const lineHeight = Math.max(size * 1.45, ascent + descent + 6);

    const lines = wrapText(c, text, availableWidth);
    const maxFitByHeight = Math.max(
      1,
      Math.floor((h - padTop - padBottom) / lineHeight),
    );
    const finalLines = lines.slice(0, Math.min(maxLines, maxFitByHeight));

    let baselineY = y + padTop + ascent;

    for (const line of finalLines) {
      c.fillText(line, tx, baselineY, availableWidth);
      baselineY += lineHeight;
    }

    c.restore();
  }

  function drawCheckMark(box: Box) {
    const x = sx(box.x);
    const y = sy(box.y);
    const w = sx(box.w);
    const h = sy(box.h);

    c.save();
    c.strokeStyle = ink;
    c.lineWidth = Math.max(2, W * 0.0032);
    c.lineCap = "round";
    c.lineJoin = "round";

    // Draw a real check mark ✓
    c.beginPath();
    c.moveTo(x + w * 0.22, y + h * 0.56);
    c.lineTo(x + w * 0.42, y + h * 0.76);
    c.lineTo(x + w * 0.78, y + h * 0.28);
    c.stroke();

    c.restore();
  }

  drawSingleLineText(input.patientFullName, LAYOUT.patientName, nameSize);
  drawSingleLineText(input.ageText, LAYOUT.age, fieldSize);
  drawSingleLineText(input.physicianName, LAYOUT.physician, fieldSize);
  drawSingleLineText(input.requestDate, LAYOUT.date, fieldSize, { rtl: false });

  if (input.gender === "male") {
    drawCheckMark(LAYOUT.genderM);
  } else if (input.gender === "female") {
    drawCheckMark(LAYOUT.genderF);
  }

  drawMultiLineText(input.diagnosis, LAYOUT.diagnosis, fieldSize, {
    maxLines: LAYOUT.diagnosis.maxLines,
  });

  drawMultiLineText(input.testTitles.join(" · "), LAYOUT.tests, fieldSize, {
    maxLines: LAYOUT.tests.maxLines,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("image_export_failed"));
      },
      "image/png",
      0.92,
    );
  });
}
