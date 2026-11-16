// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { InputMessage, type QueuedMessage } from "@/registry/default/input-message";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
window.matchMedia ??= ((query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as MediaQueryList) as typeof window.matchMedia;

function Composer(props: Partial<React.ComponentProps<typeof InputMessage>>) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  return (
    <InputMessage
      value={value}
      onValueChange={setValue}
      files={files}
      onFilesChange={(next) => {
        setFiles(next);
        props.onFilesChange?.(next);
      }}
      {...props}
    />
  );
}

const txt = () => new File(["x"], "notes.txt", { type: "text/plain" });
const png = () => new File(["x"], "a.png", { type: "image/png" });
const pdf = () => new File(["x"], "Report.PDF", { type: "application/pdf" });

describe("InputMessage accept filter", () => {
  const rows: [string, string | undefined, () => File, boolean][] = [
    ["empty accept takes text/plain", "", txt, true],
    ["*/* takes text/plain", "*/*", txt, true],
    ["image/* takes png", "image/*", png, true],
    ["image/* rejects text/plain", "image/*", txt, false],
    [".pdf takes Report.PDF", ".pdf", pdf, true],
    ["default rejects text/plain", undefined, txt, false],
    ["default takes png", undefined, png, true],
  ];

  it.each(rows)("%s", (_name, accept, make, accepted) => {
    const onFilesChange = vi.fn();
    const { container } = render(
      <Composer
        onFilesChange={onFilesChange}
        {...(accept === undefined ? {} : { accept })}
      />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const file = make();
    fireEvent.change(input, { target: { files: [file] } });
    if (accepted) {
      expect(onFilesChange).toHaveBeenCalled();
      expect(onFilesChange.mock.calls[0][0]).toContain(file);
    } else {
      expect(onFilesChange).not.toHaveBeenCalled();
    }
  });
});

describe("InputMessage queue ids", () => {
  it("queues without crypto.randomUUID and mints distinct ids", () => {
    vi.stubGlobal("crypto", {});
    const queues: QueuedMessage[][] = [];

    function Queueing() {
      const [value, setValue] = useState("");
      const [queue, setQueue] = useState<QueuedMessage[]>([]);
      return (
        <InputMessage
          value={value}
          onValueChange={setValue}
          status="streaming"
          queue={queue}
          onQueueChange={(next) => {
            queues.push(next);
            setQueue(next);
          }}
        />
      );
    }

    const { container } = render(<Queueing />);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "first" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(queues).toHaveLength(1);
    expect(queues[0]).toHaveLength(1);
    expect(queues[0][0].text).toBe("first");
    expect(queues[0][0].id).toBeTruthy();

    fireEvent.change(textarea, { target: { value: "second" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(queues).toHaveLength(2);
    expect(queues[1]).toHaveLength(2);
    expect(queues[1][1].text).toBe("second");
    expect(queues[1][1].id).not.toBe(queues[1][0].id);
  });
});
