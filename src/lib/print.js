/**
 * Shared print helper.
 * Clears the document title and uses zero @page margins so Chrome/Edge
 * do not print URL/date headers and footers (those need margin space).
 */
export function printPage({
  portrait = false,
  styleId = 'app-print-page-size',
  css = null,
  onBefore,
  onAfter,
} = {}) {
  const previousTitle = document.title
  document.title = ' '

  let style = null
  if (portrait || css) {
    style = document.createElement('style')
    style.id = styleId
    style.textContent =
      css ||
      `
      @media print {
        @page {
          size: A4 portrait !important;
          margin: 0 !important;
        }
        html, body {
          height: auto !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `
    document.head.appendChild(style)
  } else {
    // Landscape / default prints — still kill browser header/footer margins
    style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @media print {
        @page {
          margin: 0 !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  onBefore?.()

  const cleanup = () => {
    document.title = previousTitle
    style?.remove()
    onAfter?.()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
