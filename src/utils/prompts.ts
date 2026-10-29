import {
  BoxRenderable,
  InputRenderable,
  InputRenderableEvents,
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  createCliRenderer,
  type KeyEvent,
} from "@opentui/core";

interface Choice<T> {
  name: string;
  value: T;
}

async function withPrompt<T>(
  title: string,
  render: (
    renderer: Awaited<ReturnType<typeof createCliRenderer>>,
    screen: BoxRenderable,
  ) => Promise<T>,
): Promise<T> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("This prompt requires an interactive terminal.");
  }

  const renderer = await createCliRenderer();
  const onKeyPress = (key: KeyEvent) => {
    if (key.name === "escape") {
      rejectPrompt(new Error("Prompt cancelled."));
    }
  };
  let rejectPrompt: (error: Error) => void = () => {};

  try {
    const screen = new BoxRenderable(renderer, {
      id: "prompt-screen",
      width: "100%",
      height: "100%",
      border: true,
      title,
      flexDirection: "column",
      padding: 1,
    });
    renderer.root.add(screen);
    renderer.keyInput.on("keypress", onKeyPress);

    return await new Promise<T>((resolve, reject) => {
      rejectPrompt = reject;
      void render(renderer, screen).then(resolve, reject);
    });
  } finally {
    renderer.keyInput.off("keypress", onKeyPress);
    renderer.destroy();
  }
}

export async function withProgress<T>(message: string, operation: () => Promise<T>): Promise<T> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return operation();
  }

  const renderer = await createCliRenderer();
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const status = new TextRenderable(renderer, {
    id: "progress-status",
    width: "100%",
    height: 1,
    content: `${frames[0]} ${message}`,
  });
  renderer.root.add(status);

  let frame = 0;
  const interval = setInterval(() => {
    frame = (frame + 1) % frames.length;
    status.content = `${frames[frame]} ${message}`;
  }, 80);

  let succeeded = false;
  try {
    const result = await operation();
    succeeded = true;
    return result;
  } finally {
    clearInterval(interval);
    status.content = `${succeeded ? "✓" : "✗"} ${message}`;
    renderer.destroy();
    if (succeeded) {
      console.log(`✓ ${message}`);
    } else {
      console.error(`✗ ${message}`);
    }
  }
}

export async function promptInput(message: string): Promise<string> {
  return withPrompt(message, (renderer, screen) => new Promise((resolve) => {
    const input = new InputRenderable(renderer, {
      id: "prompt-input",
      width: "100%",
      placeholder: "Type a value and press Enter",
    });
    input.on(InputRenderableEvents.ENTER, () => resolve(input.value));
    input.focus();
    screen.add(input);
  }));
}

export async function promptSelect<T>(
  message: string,
  choices: Choice<T>[],
): Promise<T> {
  if (choices.length === 0) {
    throw new Error("A selection prompt requires at least one choice.");
  }

  return withPrompt(message, (renderer, screen) => new Promise((resolve, reject) => {
    const menu = new SelectRenderable(renderer, {
      id: "prompt-select",
      width: "100%",
      height: Math.max(3, Math.min(choices.length + 1, 12)),
      options: choices.map(({ name, value }) => ({
        name,
        description: "",
        value,
      })),
      showDescription: false,
    });
    menu.on(SelectRenderableEvents.ITEM_SELECTED, (index: number) => {
      const choice = choices[index];
      if (choice) {
        resolve(choice.value);
      } else {
        reject(new Error("Selection returned an invalid choice index."));
      }
    });
    menu.focus();
    screen.add(menu);
  }));
}

export async function promptCheckbox(message: string, choices: string[]): Promise<string[]> {
  if (choices.length === 0) {
    throw new Error("A multi-select prompt requires at least one choice.");
  }

  return withPrompt(
    `${message} (Enter toggles; select Done to finish)`,
    (renderer, screen) => new Promise((resolve) => {
      const selected = new Set<number>();
      const done = Symbol("done");
      const menu = new SelectRenderable(renderer, {
        id: "prompt-checkbox",
        width: "100%",
        height: Math.max(3, Math.min(choices.length + 1, 12)),
        showDescription: false,
        options: [],
      });

      const updateOptions = (selectedIndex = menu.getSelectedIndex()) => {
        menu.options = [
          ...choices.map((choice, index) => ({
            name: `${selected.has(index) ? "[x]" : "[ ]"} ${choice}`,
            description: "",
            value: index,
          })),
          { name: "Done", description: "", value: done },
        ];
        menu.selectedIndex = Math.min(selectedIndex, menu.options.length - 1);
      };

      updateOptions();
      menu.on(
        SelectRenderableEvents.ITEM_SELECTED,
        (_index: number, option: { name: string; value?: unknown }) => {
          if (option.value === done) {
            resolve(choices.filter((_choice, index) => selected.has(index)));
            return;
          }

          if (typeof option.value === "number") {
            if (selected.has(option.value)) {
              selected.delete(option.value);
            } else {
              selected.add(option.value);
            }
            updateOptions(menu.getSelectedIndex());
          }
        },
      );
      menu.focus();
      screen.add(menu);
    }),
  );
}

export async function promptConfirm(message: string): Promise<boolean> {
  return promptSelect(message, [
    { name: "No", value: false },
    { name: "Yes", value: true },
  ]);
}
