"use client";

import { useEffect, useMemo, useState } from "react";
import type { DeckOutline, PptJob, SlidePlan } from "@/lib/schemas";

type UploadedFile = { id: string; name: string; size: number; text: string; extractedTextPreview: string };
type Step = "input" | "outline-loading" | "outline-review" | "generating" | "done" | "failed";

export default function Home() {
  const [title, setTitle] = useState("大学生短视频消费行为分析");
  const [rawContent, setRawContent] = useState("老师要求结合课堂概念，说明短视频平台如何影响大学生的消费选择。需要有背景、分析、案例和总结。");
  const [pageCount, setPageCount] = useState(8);
  const [tone, setTone] = useState<"safe" | "plain" | "lazy">("safe");
  const [style, setStyle] = useState<"competition" | "cute" | "luxury" | "minimalist" | "tech" | "academic">("competition");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [outline, setOutline] = useState<DeckOutline | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [step, setStep] = useState<Step>("input");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<PptJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = outline?.slides[currentSlide];
  const canGenerateOutline = title.trim() && rawContent.trim() && step !== "outline-loading";

  useEffect(() => {
    if (!jobId || job?.status === "done" || job?.status === "failed") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/ppt/jobs/${jobId}`);
      const data = await response.json();
      if (!response.ok) return;
      setJob(data);
      if (data.status === "done") setStep("done");
      if (data.status === "failed") {
        setStep("failed");
        setError(data.error ?? "生成失败。");
      }
    }, 1200);
    return () => window.clearInterval(timer);
  }, [jobId, job?.status]);

  const progressText = useMemo(() => {
    if (!job) return "等待确认。";
    if (job.status === "done") return "PPT 已经压好，可以下载。";
    if (job.status === "building-ppt") return "图片齐了，正在塞进 PPT。";
    return `${job.completedSlides}/${job.totalSlides} 页图片完成。`;
  }, [job]);

  async function uploadFiles(selected: FileList | null) {
    if (!selected?.length) return;
    setError(null);
    const formData = new FormData();
    Array.from(selected).forEach((file) => formData.append("files", file));
    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "附件读取失败。");
    setFiles((prev) => [...prev, ...data.files]);
  }

  async function requestOutline() {
    setStep("outline-loading");
    setError(null);
    const response = await fetch("/api/outline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, rawContent, pageCount, tone, style, attachmentTexts: files.map((file) => file.text) }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStep("input");
      return setError(data.error ?? "大纲没拆出来。");
    }
    setOutline(data);
    setCurrentSlide(0);
    setStep("outline-review");
  }

  function updateCurrentSlide(patch: Partial<SlidePlan>) {
    if (!outline) return;
    const slides = outline.slides.map((slide, index) => (index === currentSlide ? { ...slide, ...patch } : slide));
    setOutline({ ...outline, slides });
  }

  async function confirmGeneration() {
    if (!outline) return;
    setStep("generating");
    setError(null);
    const response = await fetch("/api/ppt/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...outline, style }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStep("outline-review");
      return setError(data.error ?? "任务没创建成功。");
    }
    setJobId(data.jobId);
    setJob(data.job);
  }

  return (
    <main className="page">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="shell">
        <header className="topbar">
          <div className="logo"><span className="logo-mark" />半个 PPT</div>
          <nav className="topnav mono"><span>outline</span><span>image2</span><span>pptx</span></nav>
          <div className="pill mono">16:9 / real image</div>
        </header>

        <section className="hero">
          <div className="hero-main">
            <div className="eyebrow mono">/ HALF PPT · COURSE DECK STATION</div>
            <h1>水课 PPT，<em>别太像 AI。</em></h1>
            <p>输入题目和材料，先让 GPT 拆页。确认后并发调用 image2，每页生成一张统一风格的图，再合成 PPT。</p>
            <div className="button-row">
              <a className="btn primary" href="#workbench">开始做</a>
              <span className="mono muted">不是模板。是整套图。</span>
            </div>
          </div>
          <div className="preview-device">
            <div className="preview-top"><span /> <b>deck preview</b></div>
            <div className="preview-slide">
              <div className="preview-index mono">/ 01</div>
              <div className="preview-title">消费路径<br />被谁改写</div>
              <div className="preview-line" />
              <div className="preview-chip mono">image2 · 16:9</div>
            </div>
          </div>
        </section>

        <section id="workbench" className="workbench panel">
          <div className="section-head">
            <div><div className="eyebrow mono">/ 01 INPUT</div><h2>把材料放进来。</h2></div>
            <p>越具体，越不像废话。附件会先提取文本，再交给 GPT 拆 PPT 方案。</p>
          </div>
          <div className="grid">
            <div className="stack">
              <div className="field"><label htmlFor="title">题目</label><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
              <div className="field"><label htmlFor="content">基础内容</label><textarea id="content" value={rawContent} onChange={(event) => setRawContent(event.target.value)} /></div>
            </div>
            <div className="stack side-card">
              <div className="field"><label htmlFor="pageCount">页数</label><select id="pageCount" value={pageCount} onChange={(event) => setPageCount(Number(event.target.value))}>{[6, 8, 10, 12, 15, 18, 20].map((count) => <option key={count} value={count}>{count} 页</option>)}</select></div>
              <div className="field"><label htmlFor="tone">写法</label><select id="tone" value={tone} onChange={(event) => setTone(event.target.value as typeof tone)}><option value="safe">老师看了不皱眉</option><option value="plain">少废话版</option><option value="lazy">水但不露馅</option></select></div>
              <div className="field"><label htmlFor="style">PPT 风格</label><select id="style" value={style} onChange={(event) => setStyle(event.target.value as typeof style)}><option value="competition">国赛标准</option><option value="cute">可爱风</option><option value="luxury">华丽高端</option><option value="minimalist">极简风</option><option value="tech">科技风</option><option value="academic">学术严谨</option></select></div>
              <label className="upload-box" htmlFor="files"><input id="files" type="file" multiple accept=".txt,.md,.pdf,.docx" onChange={(event) => uploadFiles(event.target.files)} /><span className="upload-title">丢附件</span><span className="mono muted">txt / md / pdf / docx</span></label>
              {files.length > 0 && <div className="file-list">{files.map((file) => <div key={file.id}><b>{file.name}</b><span>{Math.round(file.size / 1024)} KB</span></div>)}</div>}
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="action-bar"><button className="btn primary large" disabled={!canGenerateOutline} onClick={requestOutline}>{step === "outline-loading" ? "GPT 正在拆页" : "生成 PPT 方案"}</button><span className="mono muted">gpt outline / editable cards</span></div>
        </section>

        {outline && current && (
          <section className="outline-area">
            <div className="section-head"><div><div className="eyebrow mono">/ 02 OUTLINE</div><h2>一页一卡，先确认逻辑。</h2></div><p>{outline.visualDirection}</p></div>
            <div className="card-stage">
              <div className="slide-card">
                <div className="slide-meta mono">/ SLIDE {String(current.index).padStart(2, "0")} · {current.role}</div>
                <h2>{current.title}</h2>
                {current.subtitle && <p className="slide-subtitle">{current.subtitle}</p>}
                <p>{current.keyMessage}</p>

                <div className="plan-section">
                  <h3>内容方案</h3>
                  <ul>{current.contentPlan.mainPoints.map((point, index) => <li key={index}>{point}</li>)}</ul>
                  {current.contentPlan.dataOrEvidence && <p className="muted">数据/证据：{current.contentPlan.dataOrEvidence}</p>}
                  {current.contentPlan.conceptsToExplain?.length ? <p className="muted">需解释概念：{current.contentPlan.conceptsToExplain.join("、")}</p> : null}
                </div>

                <div className="plan-section">
                  <h3>排版方案</h3>
                  <p><b>结构：</b>{current.layoutPlan.structure}</p>
                  <p><b>主视觉：</b>{current.layoutPlan.visualElement}</p>
                  <p><b>文字排布：</b>{current.layoutPlan.textPlacement}</p>
                </div>

                <div className="plan-section">
                  <h3>设计方案</h3>
                  <p><b>配色：</b>{current.designPlan.colorScheme}</p>
                  <p><b>背景：</b>{current.designPlan.backgroundStyle}</p>
                  <p><b>强调细节：</b>{current.designPlan.accentDetails}</p>
                </div>

                <div className="edit-grid"><div className="field"><label htmlFor="slideTitle">标题</label><input id="slideTitle" value={current.title} onChange={(event) => updateCurrentSlide({ title: event.target.value })} /></div><div className="field"><label htmlFor="imageHint">画面方案</label><textarea id="imageHint" value={current.imagePromptHint} onChange={(event) => updateCurrentSlide({ imagePromptHint: event.target.value })} /></div></div>
              </div>
              <aside className="panel inspector">
                <div className="mono muted">/ DECK MAP</div>
                <div className="rail">{outline.slides.map((slide, index) => <button key={slide.id} className={index === currentSlide ? "rail-dot active" : "rail-dot"} onClick={() => setCurrentSlide(index)}>{String(index + 1).padStart(2, "0")}</button>)}</div>
                <div className="button-row"><button className="btn" disabled={currentSlide === 0} onClick={() => setCurrentSlide((value) => value - 1)}>上一页</button><button className="btn" disabled={currentSlide === outline.slides.length - 1} onClick={() => setCurrentSlide((value) => value + 1)}>下一页</button></div>
                <button className="btn accent large" disabled={step === "generating" || step === "done"} onClick={confirmGeneration}>确认，调用 image2</button>
              </aside>
            </div>
          </section>
        )}

        {(job || step === "generating" || step === "done") && (
          <section className="generation panel">
            <div className="section-head"><div><div className="eyebrow mono">/ 03 IMAGE2 + PPTX</div><h2>{progressText}</h2></div>{job?.downloadUrl && <a className="btn primary" href={job.downloadUrl}>下载 PPT</a>}</div>
            <div className="image-grid">{job?.slides.map((slide) => <div className="image-tile" key={slide.slideId}>{slide.imageUrl ? <div className="image-preview" style={{ backgroundImage: `url(${slide.imageUrl})` }} role="img" aria-label={slide.title} /> : <div className="image-empty mono">{slide.status}</div>}<div><b>{String(slide.index).padStart(2, "0")} · {slide.title}</b><span className="mono muted">{slide.status}</span></div></div>)}</div>
          </section>
        )}

        <footer className="footer-note mono">我做半个软件，剩下半个由你填满。</footer>
      </div>
    </main>
  );
}
