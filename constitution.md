# Zeonta — Constitution

This document defines the immutable principles of the Zeonta project. Implementation details may evolve, but these principles do not change without deliberate revision.

---

## Vision

Zeonta exists to eliminate the friction between writing a useful script and using it repeatedly. Users who work frequently with shell scripts or Go functions should be able to store, configure, and execute them from a GUI — without opening a terminal each time.

---

## Core Principles

1. **The user owns their tools.** Every tool in Zeonta is created, edited, and deleted by the user. The app ships with no pre-built tools.

2. **Execution is local and offline.** Zeonta never requires a network connection. All scripts and functions run on the user's machine.

3. **Simplicity over power.** Zeonta is a script launcher, not an IDE. It does not provide debugging, version control, or dependency management for scripts.

4. **Tools are self-contained.** Each tool carries its own script/function body, parameter definitions, and environment variables. One tool does not depend on another.

5. **The UI is the product.** The value of Zeonta is in the GUI. CLI access to tools is out of scope.

---

## Non-Negotiables

- Binary size must not exceed **10MB**
- v1 targets **Windows only**
- The app must run fully **offline**
- Tools must support **user-defined parameters** and **environment variables**
- Users must be able to **add, modify, delete, and run** tools from the UI

---

## What Zeonta Is Not

- Not a CI/CD pipeline tool
- Not a remote script execution platform
- Not a script marketplace or library
- Not designed for non-technical users (assumes comfort with scripting)

---

## v1 Scope

The minimum viable product must deliver:

| Feature | Description |
|---|---|
| Tool creation | User writes a script or Go function body and saves it as a named tool |
| Parameter definition | User defines named input parameters for a tool |
| Environment variables | User defines key-value env vars attached to a tool |
| Tool execution | User runs a tool from the UI; output is displayed inline |
| Tool modification | User can edit any tool's body, parameters, or env vars |
| Tool deletion | User can delete a tool permanently |

Everything beyond this list is deferred to post-v1.