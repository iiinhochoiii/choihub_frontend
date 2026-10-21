"use client";

import { Global, css } from "@emotion/react";
import { mq, theme } from "./theme";

const globalStyles = css`
  :root {
    --color-bg: #f5f6f8;
    --color-surface: #ffffff;
    --color-surface-muted: #f8f9fb;
    --color-surface-hover: #f1f3f6;
    --color-border: #e4e7ec;
    --color-border-strong: #cfd4dc;
    --color-text: #101828;
    --color-text-muted: #475467;
    --color-text-subtle: #98a2b3;
    --color-primary: #3b5bdb;
    --color-primary-hover: #364fc7;
    --color-primary-soft: #edf2ff;
    --color-success: #0f9f6e;
    --color-success-soft: #e6f6ef;
    --color-warning: #c27803;
    --color-warning-soft: #fdf3e1;
    --color-danger: #d92d20;
    --color-danger-soft: #fdecea;
    --color-info: #0b7dbb;
    --color-info-soft: #e5f3fb;
    --color-overlay: rgba(16, 24, 40, 0.48);
    color-scheme: light;
  }

  ${mq.dark} {
    :root {
      --color-bg: #0b0d12;
      --color-surface: #14171f;
      --color-surface-muted: #1a1e27;
      --color-surface-hover: #212632;
      --color-border: #262b36;
      --color-border-strong: #353b49;
      --color-text: #eef0f4;
      --color-text-muted: #a9b0bf;
      --color-text-subtle: #6b7385;
      --color-primary: #6d8bff;
      --color-primary-hover: #8aa2ff;
      --color-primary-soft: #1c2440;
      --color-success: #34c48f;
      --color-success-soft: #12291f;
      --color-warning: #f0b43c;
      --color-warning-soft: #2e2412;
      --color-danger: #f26b5e;
      --color-danger-soft: #331a18;
      --color-info: #4cb6ec;
      --color-info-soft: #112836;
      --color-overlay: rgba(0, 0, 0, 0.6);
      color-scheme: dark;
    }
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    height: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    background: ${theme.colors.background};
    color: ${theme.colors.text};
    font-family: ${theme.fonts.sans};
    font-size: 14px;
    line-height: 1.5;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img,
  svg {
    display: block;
    max-width: 100%;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }

  button {
    cursor: pointer;
    background: none;
    border: none;
  }

  button:disabled {
    cursor: not-allowed;
  }

  ul,
  ol {
    list-style: none;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  :focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

export default function GlobalStyle() {
  return <Global styles={globalStyles} />;
}
