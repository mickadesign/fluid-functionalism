// ---------------------------------------------------------------------------
// Install-grade generation for AskUserQuestions presets: one component file
// carrying the configured question flow. The questions literal comes from
// the SAME emitter the playground's Code tab uses (auqQuestionLines), so the
// installed file and the taught snippet are identical by construction.
// ---------------------------------------------------------------------------

import type { PresetFile } from "./sidebar-install";
import type { PresetGenerator } from "./light-generators";
import {
  auqQuestionLines,
  type AskUserQuestionsPreset,
} from "./ask-user-questions-options";

export function generateAuqPresetFiles(p: AskUserQuestionsPreset): PresetFile[] {
  const l: string[] = [];
  l.push(`"use client";`);
  l.push(``);
  l.push(`import { type ComponentProps } from "react";`);
  l.push(`import { AskUserQuestions, type AskUserQuestion } from "@/components/ui/ask-user-questions";`);
  l.push(``);
  l.push(`// Generated from a fluidfunctionalism.com playground preset —`);
  l.push(`// swap the questions for your own.`);
  l.push(...auqQuestionLines(p, "", `const questions: AskUserQuestion[] = [`));
  l.push(``);
  l.push(`export function QuestionFlow(`);
  l.push(`  props: Omit<ComponentProps<typeof AskUserQuestions>, "questions">`);
  l.push(`) {`);
  l.push(`  return <AskUserQuestions questions={questions} {...props} />;`);
  l.push(`}`);
  return [
    {
      path: "components/question-flow.tsx",
      type: "registry:component",
      target: "components/question-flow.tsx",
      content: l.join("\n") + "\n",
    },
  ];
}

export function auqPresetRegistryDeps(_p: AskUserQuestionsPreset): string[] {
  return ["ask-user-questions"];
}

export function auqPresetNpmDeps(_p: AskUserQuestionsPreset): string[] {
  return [];
}

export const AUQ_PRESET_GENERATOR: PresetGenerator = {
  title: "AskUserQuestions (playground preset)",
  description:
    "A question flow generated from a fluidfunctionalism.com playground configuration — the exact variant you built, installable.",
  files: (p) => generateAuqPresetFiles(p as unknown as AskUserQuestionsPreset),
  registryDeps: (p) => auqPresetRegistryDeps(p as unknown as AskUserQuestionsPreset),
  npmDeps: (p) => auqPresetNpmDeps(p as unknown as AskUserQuestionsPreset),
};
