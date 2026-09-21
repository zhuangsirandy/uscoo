import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import ts from 'typescript';

const dictionary = JSON.parse(fs.readFileSync('lib/translations.en.json', 'utf8'));
const files = execFileSync('rg', [
  '--files',
  '--no-ignore',
  '-g', '!node_modules/**',
  'app',
  'components',
  'lib',
  '-g',
  '*.ts',
  '-g',
  '*.tsx',
], { encoding: 'utf8' }).trim().split('\n');
const missing = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function inspect(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 't' &&
      node.arguments.length === 1
    ) {
      function inspectArgument(argumentNode) {
        if (
          (ts.isStringLiteral(argumentNode) || ts.isNoSubstitutionTemplateLiteral(argumentNode)) &&
          /[\u3400-\u9fff]/.test(argumentNode.text) &&
          !dictionary[argumentNode.text] &&
          !dictionary[argumentNode.text.trim()]
        ) {
          const position = sourceFile.getLineAndCharacterOfPosition(argumentNode.getStart());
          missing.push(`${file}:${position.line + 1} ${argumentNode.text}`);
        }
        ts.forEachChild(argumentNode, inspectArgument);
      }
      inspectArgument(node.arguments[0]);
    }
    if (ts.isCallExpression(node)) {
      const isSetError = ts.isIdentifier(node.expression) &&
        ['setError', 'setProjectsError', 'setFileNote'].includes(node.expression.text);
      if (isSetError && node.arguments[0]) inspectRuntimeMessage(node.arguments[0]);
    }
    if (ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['Error', 'HttpError'].includes(node.expression.text)) {
      const index = node.expression.text === 'HttpError' ? 1 : 0;
      if (node.arguments?.[index]) inspectRuntimeMessage(node.arguments[index]);
    }
    ts.forEachChild(node, inspect);
  }

  function inspectRuntimeMessage(argumentNode) {
    if (
      (ts.isStringLiteral(argumentNode) || ts.isNoSubstitutionTemplateLiteral(argumentNode)) &&
      /[\u3400-\u9fff]/.test(argumentNode.text) &&
      !dictionary[argumentNode.text] &&
      !dictionary[argumentNode.text.trim()]
    ) {
      const position = sourceFile.getLineAndCharacterOfPosition(argumentNode.getStart());
      missing.push(`${file}:${position.line + 1} runtime message: ${argumentNode.text}`);
    }
  }

  inspect(sourceFile);
}

const requiredDynamicLabels = [
  '已有美国公司可以提出申请',
  '正在注册或准备美国公司',
  '尚无申请公司',
  '不确定申请公司需要满足什么条件',
  '3个月以内',
  '3–6个月',
  '6–12个月',
  '还没有明确计划',
  '自主申请',
  '委托律师',
  '尚未决定',
];

for (const label of requiredDynamicLabels) {
  if (!dictionary[label]) missing.push(`dynamic label: ${label}`);
}

if (missing.length) {
  console.error(`Missing English translations:\n${[...new Set(missing)].join('\n')}`);
  process.exit(1);
}

console.log('English translation coverage passed.');
