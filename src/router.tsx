import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { ShapeProvider } from "./components";
import { DocsLayout } from "./docs/DocsLayout";
import { DocsIndex } from "./docs/DocsIndex";
import { ButtonDoc } from "./docs/pages/ButtonDoc";
import { DialogDoc } from "./docs/pages/DialogDoc";
import { SwitchDoc } from "./docs/pages/SwitchDoc";
import { RadioGroupDoc } from "./docs/pages/RadioGroupDoc";
import { CheckboxGroupDoc } from "./docs/pages/CheckboxGroupDoc";
import { DropdownDoc } from "./docs/pages/DropdownDoc";
import { SubtleTabDoc } from "./docs/pages/SubtleTabDoc";
import { InputGroupDoc } from "./docs/pages/InputGroupDoc";
import { TableDoc } from "./docs/pages/TableDoc";
import { ThinkingIndicatorDoc } from "./docs/pages/ThinkingIndicatorDoc";

function DocsShell() {
  return (
    <ShapeProvider>
      <DocsLayout />
    </ShapeProvider>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  {
    path: "/docs",
    element: <DocsShell />,
    children: [
      { index: true, element: <DocsIndex /> },
      { path: "button", element: <ButtonDoc /> },
      { path: "dialog", element: <DialogDoc /> },
      { path: "switch", element: <SwitchDoc /> },
      { path: "radio-group", element: <RadioGroupDoc /> },
      { path: "checkbox-group", element: <CheckboxGroupDoc /> },
      { path: "dropdown", element: <DropdownDoc /> },
      { path: "subtle-tab", element: <SubtleTabDoc /> },
      { path: "input-group", element: <InputGroupDoc /> },
      { path: "table", element: <TableDoc /> },
      { path: "thinking-indicator", element: <ThinkingIndicatorDoc /> },
    ],
  },
]);
