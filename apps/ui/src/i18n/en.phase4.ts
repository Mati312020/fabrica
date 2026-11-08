import type { esPhase4 } from "./es.phase4";

/** Phase 4 texts (preview, browser report, notices, commit) in English. */
export const enPhase4: typeof esPhase4 = {
  preview: {
    open: "Review preview…",
    unsafe: "The preview is not a safe local address; it is not shown.",
    dialog: "Approval of block {{name}}",
    pending: "approval pending · visual block",
    title: "preview",
    iframe: "Block preview",
    width: "Preview width",
    desktop: "Desktop",
    mobile: "Mobile",
    mark: "Mark on screen",
    marking: "Marking on screen",
    markLayer: "Layer for marking areas",
    close: "Close",
    changes: "what to change · {{count}}",
    markHint: "Click on the preview to drop a numbered pin, then write what should change.",
    enableHint: "Turn on “Mark on screen” to point at areas. Each mark travels with the rejection to the agent.",
    markText: "Comment for mark {{n}}",
    removeMark: "Remove mark {{n}}",
    general: "general comment",
    approve: "Approve and snap in",
    rejectComment: "Reject with comment",
    reject_one: "Reject with {{count}} mark",
    reject_other: "Reject with {{count}} marks",
    rejectNote: "Rejecting sends the block back to coding with the marks and comment; it goes through audit again.",
  },
  report: {
    title: "browser report · task {{task}}",
    clean: "No errors during the walkthrough.",
    errors: "console errors",
    failed: "failed requests",
    steps: "failed steps",
    captures: "screenshots",
    capturesNote: "Paths inside the project folder (.fabrica/capturas); the interface does not open them.",
  },
  notices: {
    dismiss: "Got it",
    no_browser: {
      title: "NO BROWSER",
      help: "Microsoft Edge was not found, so this block is audited by reading the code only. Install or repair Edge to walk the page like a user.",
    },
    browser_failed: {
      title: "BROWSER FAILED",
      help: "The browser walkthrough could not finish. The block went on with the code audit; try again or check the preview by hand.",
    },
    git_failed: {
      title: "COMMIT FAILED",
      help: "The block commit could not be saved, but the block was assembled anyway. Check that the folder is a healthy git repo and git is installed.",
    },
  },
  commit: {
    label: "Commit per block",
    help: "Each approved block becomes a commit in the project folder. It never pushes.",
    noRepo: "Disabled: the project folder is not a git repository yet (run git init there to enable it).",
  },
};
