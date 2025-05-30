if (Cypress.config('isInteractive')) {
  window.__cyErrorMap = window.__cyErrorMap || new Map();

  const isLoggingEnabled =
    Cypress.env('CY_COPY_PROMPT_ENABLE_LOGS') === 'true' || Cypress.env('CY_COPY_PROMPT_ENABLE_LOGS') === true;

  function log(level, message, data = null) {
    if (!isLoggingEnabled) return;

    const prefix = `[CY-COPY-PROMPT] [${level.toUpperCase()}]`;

    if (data) {
      console.groupCollapsed(`${prefix} ${message}`);
      console.log('Data:', data);
      console.groupEnd();
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  function cleanupErrorMap(max = 200, retain = 50) {
    if (__cyErrorMap.size > max) {
      log('info', `Cleaning up error map. Current size: ${__cyErrorMap.size}, retaining: ${retain}`);
      const recentErrors = Array.from(__cyErrorMap.entries()).slice(-retain);
      __cyErrorMap.clear();
      for (const [key, val] of recentErrors) {
        __cyErrorMap.set(key, val);
      }
      log('info', `Error map cleanup complete. New size: ${__cyErrorMap.size}`);
    }
  }

  function createPrompt(data) {
    const prompt = `# Instructions

You are a Cypress testing expert. Analyze the following failed test and:
- Identify the root cause.
- Explain the issue briefly, per Cypress best practices.
- Suggest a corrected version of the code, if applicable.

# Test Info
- Name: ${data.testTitle}
- Location: ${data.testLocation}

# Environment
- Browser: ${data.browser.displayName} ${data.browser.version}
- Cypress: ${data.cypressVersion}
- Node: ${data.nodeVersion}
- OS: ${data.operatingSystem}

# Error Details
\`\`\`
${data.stackTrace}
\`\`\`

# Test Code
\`\`\`javascript
${data.codeFrame}
\`\`\``;

    return prompt;
  }

  function copyToClipboard(text, button) {
    top.navigator?.clipboard
      ?.writeText(text)
      .then(() => {
        log('success', 'Prompt copied to clipboard successfully');
        showSuccessFeedback(button);
      })
      .catch((err) => {
        log('error', 'Clipboard API error occurred', err);
        console.error('Clipboard API error:', err);
      });
  }

  function showSuccessFeedback(button) {
    const checkMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
    const originalHTML = button.innerHTML;
    const originalBg = button.style.backgroundColor;
    const originalBorder = button.style.borderColor;
    const originalCursor = button.style.cursor;

    // Disable the button to prevent multiple clicks
    button.disabled = true;
    button.style.cursor = 'default';
    button.innerHTML = `${checkMarkSvg}Copied to Clipboard`;
    button.style.backgroundColor = '#059669';
    button.style.borderColor = '#047857';
    button.style.boxShadow = '0 2px 4px rgba(5, 150, 105, 0.2), 0 1px 2px rgba(5, 150, 105, 0.1)';
    button.style.transform = 'translateY(0)';

    log('success', 'Button disabled and success feedback displayed');

    setTimeout(() => {
      button.disabled = false;
      button.style.cursor = originalCursor;
      button.innerHTML = originalHTML;
      button.style.backgroundColor = originalBg;
      button.style.borderColor = originalBorder;
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
      log('debug', 'Button re-enabled and state reset to original');
    }, 2000);
  }

  function createCopyButton(errorData) {
    const copySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" style="margin-right: 8px;">
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="1.5"/>
  <path d="m5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="1.5"/>
  <path d="M12 14h6M12 17h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

    const button = document.createElement('button');
    button.innerHTML = `${copySvg}Copy Debug Prompt`;
    Object.assign(button.style, {
      width: '100%',
      margin: '12px 0',
      padding: '8px 16px',
      backgroundColor: '#4956e3',
      color: 'white',
      border: '1px solid #4046d9',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.2s ease-in-out',
      textTransform: 'none',
      letterSpacing: '0.025em',
      lineHeight: '1.25',
      outline: 'none',
      position: 'relative',
      overflow: 'hidden',
    });
    button.className = 'copy-ai-prompt-button';
    button._errorData = errorData;

    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.backgroundColor = '#4046d9';
        button.style.borderColor = '#3638cf';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
        button.style.transform = 'translateY(-1px)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (!button.disabled) {
        button.style.backgroundColor = '#4956e3';
        button.style.borderColor = '#4046d9';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
        button.style.transform = 'translateY(0)';
      }
    });

    button.addEventListener('mousedown', () => {
      if (!button.disabled) {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
      }
    });

    button.addEventListener('mouseup', () => {
      if (!button.disabled) {
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
      }
    });

    button.onclick = () => {
      const prompt = createPrompt(errorData);
      copyToClipboard(prompt, button);
    };

    return button;
  }

  function extractErrorData(error, runnable) {
    const location = `${error.codeFrame?.originalFile}:${error.codeFrame?.line}:${error.codeFrame?.column}`;
    const errorData = {
      testTitle: runnable.title || 'Unknown test',
      testFile: error.codeFrame?.originalFile || error.codeFrame?.relativeFile || 'Unknown file',
      testLocation: location,
      errorMessage: error.message || 'Unknown error occurred',
      stackTrace: error.stack || 'No stack trace available',
      codeFrame: error.codeFrame?.frame || '',
      timestamp: Date.now(),
      browser: Cypress.config('browser'),
      cypressVersion: Cypress.version,
      nodeVersion: Cypress.config('resolvedNodeVersion'),
      operatingSystem: navigator.userAgentData?.platform || 'Unknown',
    };

    log('info', 'Error data extracted', {
      testTitle: errorData.testTitle,
      testFile: errorData.testFile,
      errorMessage: errorData.errorMessage?.substring(0, 100) + '...',
      browser: errorData.browser?.displayName,
    });

    return errorData;
  }

  function findMatchingError(wrapper) {
    const filePathEl =
      wrapper.closest('.runnable-err')?.querySelector('.runnable-err-file-path') ||
      wrapper.closest('.runnable-err')?.querySelector('[class*="file-path"]') ||
      wrapper.closest('.runnable-err')?.querySelector('[class*="location"]');

    const filePath = filePathEl?.textContent.trim();
    log('debug', 'Found file path in DOM', { filePath });

    if (filePath) {
      const exact = __cyErrorMap.get(filePath);
      if (exact) {
        return exact;
      }

      for (const [key, val] of __cyErrorMap) {
        if (key.includes(filePath) || filePath.includes(key)) {
          log('debug', 'Found partial match in error map', { matchedKey: key });
          return val;
        }
      }
    }

    const title = wrapper.closest('.runnable')?.querySelector('.runnable-title')?.textContent.trim();
    log('debug', 'Trying to match by test title', { title });

    if (title) {
      for (const val of __cyErrorMap.values()) {
        if (val.testTitle === title) {
          log('debug', 'Found match by test title');
          return val;
        }
      }
    }

    const fallback = Array.from(__cyErrorMap.values()).pop();
    log('debug', 'Using fallback error (most recent)', {
      fallbackExists: !!fallback,
      errorMapSize: __cyErrorMap.size,
    });

    return fallback;
  }

  function observeAndInjectCopyButtons() {
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        const wrappers = top.document.querySelectorAll('.collapsible-header-wrapper.runnable-err-stack-expander');

        wrappers.forEach((wrapper, index) => {
          if (wrapper.querySelector('.copy-ai-prompt-button')) {
            return;
          }

          const errorData = findMatchingError(wrapper);
          if (!errorData) {
            return;
          }

          wrapper.appendChild(createCopyButton(errorData));
        });
      }, 100);
    });

    observer.observe(top.document.body, { childList: true, subtree: true });
  }

  Cypress.on('fail', (error, runnable) => {
    const data = extractErrorData(error, runnable);

    __cyErrorMap.set(data.testLocation, data);
    log('info', `Error stored in map. Total errors: ${__cyErrorMap.size}`);

    cleanupErrorMap();
    observeAndInjectCopyButtons();

    throw error;
  });
}
