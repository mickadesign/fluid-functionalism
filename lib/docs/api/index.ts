// Every doc page's API reference, keyed by page slug. One module per page
// (lib/docs/api/<slug>.ts); tests/docs-markdown.test.ts checks that every
// page with a PropsTable is listed here.
import type { ApiTable } from "@/lib/docs/api/types";
import { apiReference as accordionApi } from "@/lib/docs/api/accordion";
import { apiReference as askUserQuestionsApi } from "@/lib/docs/api/ask-user-questions";
import { apiReference as badgeApi } from "@/lib/docs/api/badge";
import { apiReference as bannerApi } from "@/lib/docs/api/banner";
import { apiReference as buttonApi } from "@/lib/docs/api/button";
import { apiReference as calendarApi } from "@/lib/docs/api/calendar";
import { apiReference as cardApi } from "@/lib/docs/api/card";
import { apiReference as carouselDotsApi } from "@/lib/docs/api/carousel-dots";
import { apiReference as chatMessageApi } from "@/lib/docs/api/chat-message";
import { apiReference as checkboxGroupApi } from "@/lib/docs/api/checkbox-group";
import { apiReference as colorPickerApi } from "@/lib/docs/api/color-picker";
import { apiReference as comboboxApi } from "@/lib/docs/api/combobox";
import { apiReference as commandMenuApi } from "@/lib/docs/api/command-menu";
import { apiReference as datePickerApi } from "@/lib/docs/api/date-picker";
import { apiReference as dialogApi } from "@/lib/docs/api/dialog";
import { apiReference as dropdownApi } from "@/lib/docs/api/dropdown";
import { apiReference as fluidHoverApi } from "@/lib/docs/api/fluid-hover";
import { apiReference as inputCopyApi } from "@/lib/docs/api/input-copy";
import { apiReference as inputGroupApi } from "@/lib/docs/api/input-group";
import { apiReference as inputMessageApi } from "@/lib/docs/api/input-message";
import { apiReference as radioGroupApi } from "@/lib/docs/api/radio-group";
import { apiReference as revealApi } from "@/lib/docs/api/reveal";
import { apiReference as scrollbarsApi } from "@/lib/docs/api/scrollbars";
import { apiReference as selectApi } from "@/lib/docs/api/select";
import { apiReference as sidebarApi } from "@/lib/docs/api/sidebar";
import { apiReference as sizesApi } from "@/lib/docs/api/sizes";
import { apiReference as sliderApi } from "@/lib/docs/api/slider";
import { apiReference as switchApi } from "@/lib/docs/api/switch";
import { apiReference as tableApi } from "@/lib/docs/api/table";
import { apiReference as tabsApi } from "@/lib/docs/api/tabs";
import { apiReference as tabsSubtleApi } from "@/lib/docs/api/tabs-subtle";
import { apiReference as thinkingIndicatorApi } from "@/lib/docs/api/thinking-indicator";
import { apiReference as thinkingStepsApi } from "@/lib/docs/api/thinking-steps";
import { apiReference as tooltipApi } from "@/lib/docs/api/tooltip";

export const API_REFERENCE: Record<string, ApiTable[]> = {
  accordion: accordionApi,
  "ask-user-questions": askUserQuestionsApi,
  badge: badgeApi,
  banner: bannerApi,
  button: buttonApi,
  calendar: calendarApi,
  card: cardApi,
  "carousel-dots": carouselDotsApi,
  "chat-message": chatMessageApi,
  "checkbox-group": checkboxGroupApi,
  "color-picker": colorPickerApi,
  combobox: comboboxApi,
  "command-menu": commandMenuApi,
  "date-picker": datePickerApi,
  dialog: dialogApi,
  dropdown: dropdownApi,
  "fluid-hover": fluidHoverApi,
  "input-copy": inputCopyApi,
  "input-group": inputGroupApi,
  "input-message": inputMessageApi,
  "radio-group": radioGroupApi,
  reveal: revealApi,
  scrollbars: scrollbarsApi,
  select: selectApi,
  sidebar: sidebarApi,
  sizes: sizesApi,
  slider: sliderApi,
  switch: switchApi,
  table: tableApi,
  tabs: tabsApi,
  "tabs-subtle": tabsSubtleApi,
  "thinking-indicator": thinkingIndicatorApi,
  "thinking-steps": thinkingStepsApi,
  tooltip: tooltipApi,
};
