function markdownLineRecords(text) {
  const rawLines = text.match(/[^\r\n]*(?:\r\n|\n|\r|$)/gu)?.filter((line) => line.length > 0) || [];
  let byteOffset = 0;
  return rawLines.map((raw, index) => {
    const content = raw.replace(/(?:\r\n|\n|\r)$/u, '');
    const startByte = byteOffset;
    byteOffset += Buffer.byteLength(raw);
    return { line: index + 1, content, startByte, endByte: byteOffset };
  });
}

export function buildMarkdownContextIndex(relativePath, buffer, maxEntries) {
  const records = markdownLineRecords(buffer.toString('utf8'));
  const allHeadings = [];
  const allPendingLines = [];
  const allRuleLocations = [];
  let completedChecklistCount = 0;
  for (const record of records) {
    const heading = record.content.match(/^ {0,3}(#{1,3})[ \t]+(.+?)\s*$/u);
    if (heading) {
      const title = heading[2].replace(/[ \t]+#+[ \t]*$/u, '').trim();
      if (title) {
        allHeadings.push({
          level: heading[1].length,
          title,
          startLine: record.line,
          startByte: record.startByte,
        });
      }
    }
    const checklist = record.content.match(/^\s*[-*+]\s+\[([ xX])\]\s+/u);
    if (checklist?.[1].toLowerCase() === 'x') completedChecklistCount += 1;
    else if (checklist) allPendingLines.push(record.line);
    for (const match of record.content.matchAll(/\b(?:AC|BR|FR|SC|UB)-\d+\b/giu)) {
      allRuleLocations.push({ id: match[0].toUpperCase(), path: relativePath, line: record.line });
    }
  }
  const headings = allHeadings.slice(0, maxEntries).map((heading, index) => {
    let next = null;
    for (let candidate = index + 1; candidate < allHeadings.length; candidate += 1) {
      if (allHeadings[candidate].level <= heading.level) {
        next = allHeadings[candidate];
        break;
      }
    }
    const endByte = next?.startByte ?? buffer.length;
    const endLine = next ? next.startLine - 1 : records.length;
    return {
      level: heading.level,
      title: heading.title,
      startLine: heading.startLine,
      endLine,
      bytes: endByte - heading.startByte,
    };
  });
  return {
    path: relativePath,
    bytes: buffer.length,
    lines: records.length,
    headingCount: allHeadings.length,
    headings,
    headingsTruncated: allHeadings.length > headings.length,
    checklist: {
      total: completedChecklistCount + allPendingLines.length,
      completed: completedChecklistCount,
      pending: allPendingLines.length,
      pendingLines: allPendingLines.slice(0, maxEntries),
      pendingLinesTruncated: allPendingLines.length > maxEntries,
    },
    ruleLocations: allRuleLocations.slice(0, maxEntries),
    ruleLocationsTruncated: allRuleLocations.length > maxEntries,
  };
}

export function buildSpecContextIndex(artifacts, maxEntries) {
  const indexes = artifacts.map((artifact) => buildMarkdownContextIndex(artifact.path, artifact.buffer, maxEntries));
  const seenRules = new Set();
  const ruleLocations = [];
  for (const index of indexes) {
    for (const location of index.ruleLocations) {
      if (seenRules.has(location.id)) continue;
      seenRules.add(location.id);
      if (ruleLocations.length < maxEntries) ruleLocations.push(location);
    }
  }
  const specDocument = indexes.find((index) => index.path.endsWith('/spec.md'));
  return {
    title: specDocument?.headings.find((heading) => heading.level === 1)?.title || null,
    artifacts: indexes.map(({ ruleLocations: _locations, ruleLocationsTruncated: _truncated, ...index }) => index),
    ruleLocations,
    ruleLocationsTruncated:
      indexes.some((index) => index.ruleLocationsTruncated) || seenRules.size > ruleLocations.length,
  };
}
