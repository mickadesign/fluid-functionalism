"use client";

import { useMemo } from "react";
import { useBase } from "@/lib/base-context";

import {
  Accordion as RadixAccordion,
  AccordionGroup as RadixAccordionGroup,
  AccordionItem as RadixAccordionItem,
  AccordionTrigger as RadixAccordionTrigger,
  AccordionContent as RadixAccordionContent,
} from "@/registry/radix/accordion";
import {
  Accordion as BaseAccordion,
  AccordionGroup as BaseAccordionGroup,
  AccordionItem as BaseAccordionItem,
  AccordionTrigger as BaseAccordionTrigger,
  AccordionContent as BaseAccordionContent,
} from "@/registry/base/accordion";

import {
  AlertDialog as RadixAlertDialog,
  AlertDialogTrigger as RadixAlertDialogTrigger,
  AlertDialogContent as RadixAlertDialogContent,
  AlertDialogHeader as RadixAlertDialogHeader,
  AlertDialogFooter as RadixAlertDialogFooter,
  AlertDialogTitle as RadixAlertDialogTitle,
  AlertDialogDescription as RadixAlertDialogDescription,
  AlertDialogCancel as RadixAlertDialogCancel,
  AlertDialogAction as RadixAlertDialogAction,
} from "@/registry/radix/alert-dialog";
import {
  AlertDialog as BaseAlertDialog,
  AlertDialogTrigger as BaseAlertDialogTrigger,
  AlertDialogContent as BaseAlertDialogContent,
  AlertDialogHeader as BaseAlertDialogHeader,
  AlertDialogFooter as BaseAlertDialogFooter,
  AlertDialogTitle as BaseAlertDialogTitle,
  AlertDialogDescription as BaseAlertDialogDescription,
  AlertDialogCancel as BaseAlertDialogCancel,
  AlertDialogAction as BaseAlertDialogAction,
} from "@/registry/base/alert-dialog";

import { Button as RadixButton } from "@/registry/radix/button";
import { Button as BaseButton } from "@/registry/base/button";

import {
  CheckboxGroup as RadixCheckboxGroup,
  CheckboxItem as RadixCheckboxItem,
} from "@/registry/radix/checkbox-group";
import {
  CheckboxGroup as BaseCheckboxGroup,
  CheckboxItem as BaseCheckboxItem,
} from "@/registry/base/checkbox-group";

import {
  Dialog as RadixDialog,
  DialogTrigger as RadixDialogTrigger,
  DialogContent as RadixDialogContent,
  DialogHeader as RadixDialogHeader,
  DialogFooter as RadixDialogFooter,
  DialogTitle as RadixDialogTitle,
  DialogDescription as RadixDialogDescription,
  DialogClose as RadixDialogClose,
} from "@/registry/radix/dialog";
import {
  Dialog as BaseDialog,
  DialogTrigger as BaseDialogTrigger,
  DialogContent as BaseDialogContent,
  DialogHeader as BaseDialogHeader,
  DialogFooter as BaseDialogFooter,
  DialogTitle as BaseDialogTitle,
  DialogDescription as BaseDialogDescription,
  DialogClose as BaseDialogClose,
} from "@/registry/base/dialog";

import {
  RadioGroup as RadixRadioGroup,
  RadioItem as RadixRadioItem,
} from "@/registry/radix/radio-group";
import {
  RadioGroup as BaseRadioGroup,
  RadioItem as BaseRadioItem,
} from "@/registry/base/radio-group";

import { Slider as RadixSlider, SliderComfortable as RadixSliderComfortable } from "@/registry/radix/slider";
import { Slider as BaseSlider, SliderComfortable as BaseSliderComfortable } from "@/registry/base/slider";

import { Switch as RadixSwitch } from "@/registry/radix/switch";
import { Switch as BaseSwitch } from "@/registry/base/switch";

import {
  Tabs as RadixTabs,
  TabsList as RadixTabsList,
  TabItem as RadixTabItem,
  TabPanel as RadixTabPanel,
} from "@/registry/radix/tabs";
import {
  Tabs as BaseTabs,
  TabsList as BaseTabsList,
  TabItem as BaseTabItem,
  TabPanel as BaseTabPanel,
} from "@/registry/base/tabs";

import { Tooltip as RadixTooltip } from "@/registry/radix/tooltip";
import { Tooltip as BaseTooltip } from "@/registry/base/tooltip";

/**
 * Returns the Radix or Base UI implementation of each dual-flavour component,
 * driven by the right-panel "Primitive" toggle (`useBase`).
 */
export function useFlavorComponents() {
  const { base } = useBase();

  return useMemo(() => {
    const isBase = base === "base";
    return {
      Accordion: isBase ? BaseAccordion : RadixAccordion,
      AccordionGroup: isBase ? BaseAccordionGroup : RadixAccordionGroup,
      AccordionItem: isBase ? BaseAccordionItem : RadixAccordionItem,
      AccordionTrigger: isBase ? BaseAccordionTrigger : RadixAccordionTrigger,
      AccordionContent: isBase ? BaseAccordionContent : RadixAccordionContent,
      AlertDialog: isBase ? BaseAlertDialog : RadixAlertDialog,
      AlertDialogTrigger: isBase ? BaseAlertDialogTrigger : RadixAlertDialogTrigger,
      AlertDialogContent: isBase ? BaseAlertDialogContent : RadixAlertDialogContent,
      AlertDialogHeader: isBase ? BaseAlertDialogHeader : RadixAlertDialogHeader,
      AlertDialogFooter: isBase ? BaseAlertDialogFooter : RadixAlertDialogFooter,
      AlertDialogTitle: isBase ? BaseAlertDialogTitle : RadixAlertDialogTitle,
      AlertDialogDescription: isBase ? BaseAlertDialogDescription : RadixAlertDialogDescription,
      AlertDialogCancel: isBase ? BaseAlertDialogCancel : RadixAlertDialogCancel,
      AlertDialogAction: isBase ? BaseAlertDialogAction : RadixAlertDialogAction,
      Button: isBase ? BaseButton : RadixButton,
      CheckboxGroup: isBase ? BaseCheckboxGroup : RadixCheckboxGroup,
      CheckboxItem: isBase ? BaseCheckboxItem : RadixCheckboxItem,
      Dialog: isBase ? BaseDialog : RadixDialog,
      DialogTrigger: isBase ? BaseDialogTrigger : RadixDialogTrigger,
      DialogContent: isBase ? BaseDialogContent : RadixDialogContent,
      DialogHeader: isBase ? BaseDialogHeader : RadixDialogHeader,
      DialogFooter: isBase ? BaseDialogFooter : RadixDialogFooter,
      DialogTitle: isBase ? BaseDialogTitle : RadixDialogTitle,
      DialogDescription: isBase ? BaseDialogDescription : RadixDialogDescription,
      DialogClose: isBase ? BaseDialogClose : RadixDialogClose,
      RadioGroup: isBase ? BaseRadioGroup : RadixRadioGroup,
      RadioItem: isBase ? BaseRadioItem : RadixRadioItem,
      Slider: isBase ? BaseSlider : RadixSlider,
      SliderComfortable: isBase ? BaseSliderComfortable : RadixSliderComfortable,
      Switch: isBase ? BaseSwitch : RadixSwitch,
      Tabs: isBase ? BaseTabs : RadixTabs,
      TabsList: isBase ? BaseTabsList : RadixTabsList,
      TabItem: isBase ? BaseTabItem : RadixTabItem,
      TabPanel: isBase ? BaseTabPanel : RadixTabPanel,
      Tooltip: isBase ? BaseTooltip : RadixTooltip,
    };
  }, [base]);
}
