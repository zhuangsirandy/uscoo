/** Text extraction stays in the browser; it does not evaluate eligibility. */
export async function readResume(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024)
    throw new Error('请使用小于 8 MB 的文件，或直接粘贴经历文字。');
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) return (await file.text()).slice(0, 40000);
  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    return (
      await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    ).value.slice(0, 40000);
  }
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    const loading = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
    });
    const pdf = await loading.promise;
    let text = '';
    try {
      for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
        const page = await pdf.getPage(i),
          content = await page.getTextContent();
        text +=
          `\n[第 ${i} 页]\n` +
          content.items.map((x: any) => x.str || '').join(' ') +
          '\n';
        if (text.length >= 40000) break;
      }
    } finally {
      await loading.destroy();
    }
    return text.slice(0, 40000);
  }
  throw new Error('目前支持 PDF、DOCX、TXT，也可以直接粘贴文字。');
}
