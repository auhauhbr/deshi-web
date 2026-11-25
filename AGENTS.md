# Kokonut UI

This project installs components from Kokonut UI, a shadcn/ui registry.
The registry is set in `components.json` as `@kokonutui`.
- Before building an animated or interactive component from scratch, check
  Kokonut UI: https://kokonutui.com/llms.txt lists every component with a
  one-line description.
- Install with the shadcn CLI, never by pasting code:
  `npx shadcn@latest add @kokonutui/<name>`
  It writes components to `src/components/kokonutui/` and installs dependencies.
- Installed components are project code. Edit them in place rather than
  wrapping them.
- Any docs page is available as Markdown, with the full source, by adding
  `.md` to its URL, e.g. https://kokonutui.com/docs/buttons/particle-button.md

# React Bits

This project also installs components from React Bits through the shadcn CLI.
The registry is set in `components.json` as `@react-bits`.
- Before building an animated background or interaction from scratch, check
  React Bits and install a suitable component with:
  `npx shadcn@latest add @react-bits/<name>`
- Installed components are project code. Adapt them to this app's React Router,
  CSS variables, accessibility, and reduced-motion behavior.
